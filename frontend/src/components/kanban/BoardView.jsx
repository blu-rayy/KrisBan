import { useState } from 'react';
import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd';
import { TicketCard } from './TicketCard';

// Compute a new float position for a ticket dropped at `destinationIndex`
const computePosition = (tickets, destinationIndex) => {
  if (tickets.length === 0) return 1000;
  if (destinationIndex === 0) return tickets[0].position / 2;
  if (destinationIndex >= tickets.length) return tickets[tickets.length - 1].position + 1000;
  return (tickets[destinationIndex - 1].position + tickets[destinationIndex].position) / 2;
};

// ── Column header with inline rename ─────────────────────────────────────────
const ColumnHeader = ({ column, onRename, onDelete, onAddTicket, ticketCount }) => {
  const [editing,  setEditing]  = useState(false);
  const [name,     setName]     = useState(column.name);
  const [showMenu, setShowMenu] = useState(false);

  const commitRename = () => {
    setEditing(false);
    if (name.trim() && name.trim() !== column.name) onRename(column.id, name.trim());
  };

  return (
    <div className="flex items-center justify-between px-2 pb-2 pt-1 min-h-[36px]">
      {editing ? (
        <input
          autoFocus
          className="flex-1 text-[14px] font-semibold text-[#172b4d] bg-white border border-blue-400 rounded px-2 py-0.5 focus:outline-none"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={commitRename}
          onKeyDown={(e) => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') { setName(column.name); setEditing(false); } }}
        />
      ) : (
        <button
          className="flex-1 text-left text-[14px] font-semibold text-[#172b4d] hover:text-black truncate"
          onClick={() => setEditing(true)}
          title={column.name}
        >
          {column.name}
        </button>
      )}

      <div className="relative ml-1 flex-shrink-0">
        <button
          onClick={() => setShowMenu((v) => !v)}
          className="w-7 h-7 flex items-center justify-center text-[#5e6c84] hover:text-[#172b4d] hover:bg-[#091e4214] rounded transition-colors"
          title="List actions"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/>
          </svg>
        </button>
        {showMenu && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
            <div className="absolute right-0 top-8 z-20 bg-white rounded-lg shadow-xl border border-gray-200 py-1 min-w-[180px]">
              <div className="px-4 py-2 text-xs font-semibold text-[#5e6c84] text-center border-b border-gray-100 mb-1">List actions</div>
              <button
                onClick={() => { setShowMenu(false); onAddTicket(column.id); }}
                className="w-full text-left px-4 py-2 text-sm text-[#172b4d] hover:bg-[#f4f5f7]"
              >Add card</button>
              <button
                onClick={() => { setShowMenu(false); setEditing(true); }}
                className="w-full text-left px-4 py-2 text-sm text-[#172b4d] hover:bg-[#f4f5f7]"
              >Rename list</button>
              <hr className="my-1 border-gray-100" />
              <button
                onClick={() => { setShowMenu(false); onDelete(column.id); }}
                className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50"
              >Delete this list</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};


// ── Quick-add card form ───────────────────────────────────────────────────────
const AddCardForm = ({ columnId, onAdd, onCancel }) => {
  const [title, setTitle] = useState('');
  return (
    <div className="px-2 pb-2 pt-0">
      <textarea
        autoFocus
        className="w-full px-3 py-2 bg-white rounded-[3px] text-sm text-[#172b4d] resize-none focus:outline-none placeholder-[#a5adba]"
        style={{ boxShadow: '0 1px 0 rgba(9,30,66,.25)' }}
        placeholder="Enter a title for this card…"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        rows={3}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (title.trim()) { onAdd(columnId, title.trim()); onCancel(); } }
          if (e.key === 'Escape') onCancel();
        }}
      />
      <div className="flex gap-2 mt-2 items-center">
        <button
          type="button"
          onClick={() => { if (title.trim()) { onAdd(columnId, title.trim()); onCancel(); } }}
          className="px-3 py-1.5 bg-[#0052cc] text-white rounded text-sm font-medium hover:bg-[#0065ff] transition-colors"
        >Add card</button>
        <button
          type="button"
          onClick={onCancel}
          className="w-8 h-8 flex items-center justify-center text-[#5e6c84] hover:text-[#172b4d] rounded hover:bg-[#091e4214] text-xl leading-none"
        >✕</button>
      </div>
    </div>
  );
};

// ── BoardView ─────────────────────────────────────────────────────────────────
export const BoardView = ({ board, columns: initialColumns, boardId, mutations, onTicketOpen }) => {
  const [columns, setColumns]             = useState(initialColumns);
  const [addingToColumn, setAddingToColumn] = useState(null);
  const [showAddList, setShowAddList]      = useState(false);
  const [newColName, setNewColName]        = useState('');
  const [dragging, setDragging]            = useState(false);
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

  const handleRenameColumn = (columnId, name) => mutations.updateColumn.mutate({ columnId, data: { name } });

  const handleDeleteColumn = (columnId) => {
    if (!window.confirm('Delete this list? All cards will be archived.')) return;
    mutations.deleteColumn.mutate(columnId);
  };

  const handleAddList = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    if (!newColName.trim()) return;
    await mutations.createColumn.mutateAsync({ name: newColName.trim() });
    setNewColName('');
    setShowAddList(false);
  };

  return (
    <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <Droppable droppableId="all-columns" direction="horizontal" type="COLUMN">
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className="flex gap-3 items-start pb-4"
            style={{ minHeight: '100%' }}
          >
            {columns.map((col, colIndex) => (
              <Draggable draggableId={`col-${col.id}`} index={colIndex} key={col.id}>
                {(colProvided, colSnapshot) => (
                  <div
                    ref={colProvided.innerRef}
                    {...colProvided.draggableProps}
                    className={`flex-shrink-0 w-[272px] rounded-[12px] flex flex-col bg-[#ebecf0] ${
                      colSnapshot.isDragging ? 'shadow-2xl opacity-90 rotate-1' : ''
                    }`}
                    style={{ maxHeight: 'calc(100vh - 180px)' }}
                  >
                    {/* Header — drag handle */}
                    <div {...colProvided.dragHandleProps} className="cursor-grab active:cursor-grabbing">
                      <ColumnHeader
                        column={col}
                        ticketCount={col.tickets?.length ?? 0}
                        onRename={handleRenameColumn}
                        onDelete={handleDeleteColumn}
                        onAddTicket={(cid) => setAddingToColumn(cid)}
                      />
                    </div>

                    {/* Scrollable cards area */}
                    <Droppable droppableId={col.id} type="TICKET">
                      {(tickProvided, tickSnapshot) => (
                        <div
                          ref={tickProvided.innerRef}
                          {...tickProvided.droppableProps}
                          className={`flex-1 overflow-y-auto overflow-x-hidden px-2 space-y-2 transition-colors ${
                            tickSnapshot.isDraggingOver ? 'bg-[#dde0e4] rounded-[4px]' : ''
                          }`}
                          style={{ minHeight: 4 }}
                        >
                          {(col.tickets || []).map((ticket, idx) => (
                            <Draggable draggableId={ticket.id} index={idx} key={ticket.id}>
                              {(tp) => (
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

                    {/* Add card / inline form */}
                    {addingToColumn === col.id ? (
                      <AddCardForm
                        columnId={col.id}
                        onAdd={handleAddTicket}
                        onCancel={() => setAddingToColumn(null)}
                      />
                    ) : (
                      <button
                        onClick={() => setAddingToColumn(col.id)}
                        className="flex items-center gap-1.5 w-full px-3 py-2 mt-1 text-[13px] text-[#5e6c84] hover:text-[#172b4d] hover:bg-[#091e4214] rounded-b-[12px] transition-colors flex-shrink-0"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                          <line x1="12" y1="5" x2="12" y2="19"/>
                          <line x1="5" y1="12" x2="19" y2="12"/>
                        </svg>
                        Add a card
                      </button>
                    )}
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}

            {/* Add another list */}
            <div className="flex-shrink-0 w-[272px]">
              {!showAddList ? (
                <button
                  onClick={() => setShowAddList(true)}
                  className="w-full flex items-center gap-2 px-3 py-2.5 bg-white/25 hover:bg-white/40 text-white rounded-[12px] text-[14px] font-medium transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="12" y1="5" x2="12" y2="19"/>
                    <line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  Add another list
                </button>
              ) : (
                <div className="bg-[#ebecf0] rounded-[12px] p-2 space-y-2">
                  <input
                    autoFocus
                    className="w-full px-3 py-2 bg-white rounded text-sm text-[#172b4d] focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm"
                    placeholder="Enter list name…"
                    value={newColName}
                    onChange={(e) => setNewColName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddList(); if (e.key === 'Escape') { setShowAddList(false); setNewColName(''); } }}
                  />
                  <div className="flex gap-2 items-center">
                    <button
                      type="button"
                      onClick={handleAddList}
                      className="px-3 py-1.5 bg-[#0052cc] text-white rounded text-sm font-medium hover:bg-[#0065ff]"
                    >Add list</button>
                    <button
                      type="button"
                      onClick={() => { setShowAddList(false); setNewColName(''); }}
                      className="w-8 h-8 flex items-center justify-center text-[#5e6c84] hover:text-[#172b4d] text-xl rounded hover:bg-[#091e4214]"
                    >✕</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
};
