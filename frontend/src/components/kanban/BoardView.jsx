import { useState } from 'react';
import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd';
import { TicketCard } from './TicketCard';

// Compute a new float position for a ticket dropped at `destinationIndex`
// within the list `tickets` (already sorted by position).
const computePosition = (tickets, destinationIndex) => {
  if (tickets.length === 0) return 1000;
  if (destinationIndex === 0) {
    return tickets[0].position / 2;
  }
  if (destinationIndex >= tickets.length) {
    return tickets[tickets.length - 1].position + 1000;
  }
  const before = tickets[destinationIndex - 1].position;
  const after  = tickets[destinationIndex].position;
  return (before + after) / 2;
};

// ── Column header with inline rename ─────────────────────────────────────────
const ColumnHeader = ({ column, onRename, onDelete, onAddTicket, ticketCount }) => {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(column.name);
  const [showMenu, setShowMenu] = useState(false);

  const commitRename = () => {
    setEditing(false);
    if (name.trim() && name.trim() !== column.name) onRename(column.id, name.trim());
  };

  return (
    <div className="flex items-center justify-between mb-2 px-1">
      {editing ? (
        <input
          autoFocus
          className="flex-1 text-sm font-semibold text-gray-700 bg-white border border-blue-300 rounded px-2 py-0.5 focus:outline-none"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={commitRename}
          onKeyDown={(e) => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') setEditing(false); }}
        />
      ) : (
        <button
          className="flex-1 text-left text-sm font-semibold text-gray-700 hover:text-gray-900 flex items-center gap-2"
          onClick={() => setEditing(true)}
        >
          <span
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: column.color }}
          />
          {column.name}
          <span className="text-xs font-normal text-gray-400">{ticketCount}</span>
        </button>
      )}

      <div className="relative">
        <button
          onClick={() => setShowMenu((v) => !v)}
          className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-700 rounded text-lg leading-none"
        >⋯</button>
        {showMenu && (
          <div
            className="absolute right-0 top-7 z-20 bg-white border border-gray-200 rounded-xl shadow-lg py-1 min-w-[140px]"
            onMouseLeave={() => setShowMenu(false)}
          >
            <button
              onClick={() => { setShowMenu(false); setEditing(true); }}
              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
            >Rename</button>
            <button
              onClick={() => { setShowMenu(false); onAddTicket(column.id); }}
              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
            >Add ticket</button>
            <hr className="my-1 border-gray-100" />
            <button
              onClick={() => { setShowMenu(false); onDelete(column.id); }}
              className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50"
            >Delete column</button>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Quick-add ticket form ─────────────────────────────────────────────────────
const AddTicketForm = ({ columnId, onAdd, onCancel }) => {
  const [title, setTitle] = useState('');
  const handleSubmit = (e) => {
    e.preventDefault();
    if (title.trim()) { onAdd(columnId, title.trim()); onCancel(); }
  };
  return (
    <form onSubmit={handleSubmit} className="mt-2 space-y-2">
      <textarea
        autoFocus
        className="w-full px-3 py-2 border border-blue-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
        placeholder="Card title…"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        rows={2}
        onKeyDown={(e) => { if (e.key === 'Escape') onCancel(); }}
      />
      <div className="flex gap-2">
        <button type="submit" className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Add</button>
        <button type="button" onClick={onCancel} className="px-3 py-1.5 text-gray-500 hover:text-gray-700 text-sm">✕</button>
      </div>
    </form>
  );
};

// ── BoardView ────────────────────────────────────────────────────────────────
export const BoardView = ({ board, columns: initialColumns, boardId, mutations, onTicketOpen }) => {
  const [columns, setColumns] = useState(initialColumns);
  const [addingToColumn, setAddingToColumn] = useState(null);
  const [showAddColumn, setShowAddColumn] = useState(false);
  const [newColName, setNewColName] = useState('');

  // Keep in sync when server data changes (but not during drag)
  const [dragging, setDragging] = useState(false);
  if (!dragging && JSON.stringify(initialColumns) !== JSON.stringify(columns)) {
    setColumns(initialColumns);
  }

  const handleDragStart = () => setDragging(true);

  const handleDragEnd = ({ source, destination, type }) => {
    setDragging(false);
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    if (type === 'COLUMN') {
      // Reorder columns
      const next = [...columns];
      const [moved] = next.splice(source.index, 1);
      next.splice(destination.index, 0, moved);

      const newPositions = next.map((col, i) => ({ ...col, position: (i + 1) * 1000 }));
      setColumns(newPositions);
      mutations.reorderColumns.mutate(newPositions.map(({ id, position }) => ({ id, position })));
      return;
    }

    // Reorder / move tickets
    const srcColIdx  = columns.findIndex((c) => c.id === source.droppableId);
    const dstColIdx  = columns.findIndex((c) => c.id === destination.droppableId);
    if (srcColIdx === -1 || dstColIdx === -1) return;

    const next = columns.map((c) => ({ ...c, tickets: [...(c.tickets || [])] }));
    const [movedTicket] = next[srcColIdx].tickets.splice(source.index, 1);

    // Insert into destination
    next[dstColIdx].tickets.splice(destination.index, 0, movedTicket);

    // Compute new position
    const newPos = computePosition(
      next[dstColIdx].tickets.filter((t) => t.id !== movedTicket.id),
      destination.index
    );
    next[dstColIdx].tickets[destination.index] = { ...movedTicket, position: newPos, column_id: destination.droppableId };

    setColumns(next);

    mutations.moveTicket.mutate({
      ticketId: movedTicket.id,
      data: { column_id: destination.droppableId, position: newPos }
    });
  };

  const handleAddTicket = async (columnId, title) => {
    await mutations.createTicket.mutateAsync({ column_id: columnId, title });
  };

  const handleRenameColumn = (columnId, name) => {
    mutations.updateColumn.mutate({ columnId, data: { name } });
  };

  const handleDeleteColumn = (columnId) => {
    if (!window.confirm('Delete this column? All tickets will be archived.')) return;
    mutations.deleteColumn.mutate(columnId);
  };

  const handleAddColumn = async (e) => {
    e.preventDefault();
    if (!newColName.trim()) return;
    await mutations.createColumn.mutateAsync({ name: newColName.trim() });
    setNewColName('');
    setShowAddColumn(false);
  };

  return (
    <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <Droppable droppableId="all-columns" direction="horizontal" type="COLUMN">
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className="flex gap-4 items-start h-full pb-6"
          >
            {columns.map((col, colIndex) => (
              <Draggable draggableId={`col-${col.id}`} index={colIndex} key={col.id}>
                {(colProvided, colSnapshot) => (
                  <div
                    ref={colProvided.innerRef}
                    {...colProvided.draggableProps}
                    className={`flex-shrink-0 w-72 bg-gray-50 rounded-2xl p-3 flex flex-col ${colSnapshot.isDragging ? 'shadow-xl ring-2 ring-blue-300' : ''}`}
                  >
                    {/* Column drag handle is the header */}
                    <div {...colProvided.dragHandleProps}>
                      <ColumnHeader
                        column={col}
                        ticketCount={col.tickets?.length ?? 0}
                        onRename={handleRenameColumn}
                        onDelete={handleDeleteColumn}
                        onAddTicket={(cid) => setAddingToColumn(cid)}
                      />
                    </div>

                    {/* Tickets droppable */}
                    <Droppable droppableId={col.id} type="TICKET">
                      {(tickProvided, tickSnapshot) => (
                        <div
                          ref={tickProvided.innerRef}
                          {...tickProvided.droppableProps}
                          className={`flex-1 min-h-[40px] space-y-2 transition-colors rounded-xl ${tickSnapshot.isDraggingOver ? 'bg-blue-50' : ''}`}
                        >
                          {(col.tickets || []).map((ticket, idx) => (
                            <Draggable draggableId={ticket.id} index={idx} key={ticket.id}>
                              {(tp, ts) => (
                                <TicketCard
                                  ticket={ticket}
                                  innerRef={tp.innerRef}
                                  draggableProps={tp.draggableProps}
                                  dragHandleProps={tp.dragHandleProps}
                                  onOpen={() => onTicketOpen(ticket.id)}
                                />
                              )}
                            </Draggable>
                          ))}
                          {tickProvided.placeholder}
                        </div>
                      )}
                    </Droppable>

                    {/* Add ticket */}
                    {addingToColumn === col.id ? (
                      <AddTicketForm
                        columnId={col.id}
                        onAdd={handleAddTicket}
                        onCancel={() => setAddingToColumn(null)}
                      />
                    ) : (
                      <button
                        onClick={() => setAddingToColumn(col.id)}
                        className="mt-2 w-full text-sm text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl px-3 py-2 text-left transition-colors"
                      >+ Add a card</button>
                    )}
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}

            {/* Add column */}
            <div className="flex-shrink-0 w-72">
              {!showAddColumn ? (
                <button
                  onClick={() => setShowAddColumn(true)}
                  className="w-full bg-white/60 hover:bg-white border border-dashed border-gray-300 rounded-2xl px-4 py-3 text-sm text-gray-400 hover:text-gray-700 transition-all"
                >+ Add column</button>
              ) : (
                <form onSubmit={handleAddColumn} className="bg-gray-50 rounded-2xl p-3 space-y-2">
                  <input
                    autoFocus
                    className="w-full px-3 py-2 border border-blue-300 rounded-xl text-sm focus:outline-none"
                    placeholder="Column name…"
                    value={newColName}
                    onChange={(e) => setNewColName(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <button type="submit" className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm">Add</button>
                    <button type="button" onClick={() => setShowAddColumn(false)} className="text-sm text-gray-500">Cancel</button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
};
