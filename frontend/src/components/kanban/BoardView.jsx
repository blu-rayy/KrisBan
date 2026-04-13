import { useState, useRef, useEffect } from 'react';
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
const ColumnHeader = ({ column, onRename, onDelete, onAddTicket, onToggleIncludeInList, ticketCount }) => {
  const [editing,  setEditing]  = useState(false);
  const [name,     setName]     = useState(column.name);
  const [showMenu, setShowMenu] = useState(false);

  const commitRename = () => {
    setEditing(false);
    if (name.trim() && name.trim() !== column.name) onRename(column.id, name.trim());
  };

  return (
    <div className="flex items-center justify-between px-3 pb-2 pt-3 min-h-[44px]">
      {/* Color dot */}
      {column.color && !editing && (
        <div
          className="w-2 h-2 rounded-full flex-shrink-0 mr-2"
          style={{ backgroundColor: column.color }}
        />
      )}

      {editing ? (
        <input
          autoFocus
          className="flex-1 text-[13px] font-semibold text-[#1f2937] dark:text-dm-text bg-white dark:bg-dm-card border border-emerald-500 rounded px-2 py-0.5 focus:outline-none"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={commitRename}
          onKeyDown={(e) => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') { setName(column.name); setEditing(false); } }}
        />
      ) : (
        <button
          className="flex-1 text-left text-[13px] font-semibold text-[#1f2937] dark:text-dm-text hover:text-black dark:hover:text-white truncate"
          onClick={() => setEditing(true)}
          title={column.name}
        >
          {column.name}
        </button>
      )}

      {/* Count badge */}
      {!editing && ticketCount > 0 && (
        <span className="ml-1.5 flex-shrink-0 text-[11px] font-semibold text-[#626f86] dark:text-dm-muted bg-black/8 dark:bg-white/10 rounded-full w-5 h-5 flex items-center justify-center">
          {ticketCount}
        </span>
      )}

      <div className="relative ml-1.5 flex-shrink-0">
        <button
          onClick={() => setShowMenu((v) => !v)}
          className="w-7 h-7 flex items-center justify-center text-[#626f86] dark:text-dm-soft hover:text-[#1f2937] dark:hover:text-dm-text hover:bg-black/10 dark:hover:bg-white/10 rounded-md transition-colors"
          title="List actions"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/>
          </svg>
        </button>
        {showMenu && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
            <div className="absolute right-0 top-9 z-20 bg-white dark:bg-dm-card rounded-xl shadow-xl border border-gray-200 dark:border-dm-border py-1.5 min-w-[190px]">
              <div className="px-4 py-2 text-xs font-semibold text-[#626f86] dark:text-dm-soft text-center border-b border-gray-100 dark:border-dm-border mb-1">List actions</div>
              <button
                onClick={() => { setShowMenu(false); onAddTicket(column.id); }}
                className="w-full text-left px-4 py-2 text-[13px] text-[#1f2937] dark:text-dm-text hover:bg-emerald-50 dark:hover:bg-dm-elevated"
              >Add card</button>
              <button
                onClick={() => { setShowMenu(false); setEditing(true); }}
                className="w-full text-left px-4 py-2 text-[13px] text-[#1f2937] dark:text-dm-text hover:bg-emerald-50 dark:hover:bg-dm-elevated"
              >Rename list</button>
              <hr className="my-1 border-gray-100 dark:border-dm-border" />
              <button
                onClick={() => { setShowMenu(false); onToggleIncludeInList(column.id, !column.include_in_list); }}
                className="w-full text-left px-4 py-2 text-[13px] text-[#1f2937] dark:text-dm-text hover:bg-emerald-50 dark:hover:bg-dm-elevated flex items-center justify-between"
              >
                <span>Include in List</span>
                {column.include_in_list && (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                )}
              </button>
              <hr className="my-1 border-gray-100 dark:border-dm-border" />
              <button
                onClick={() => { setShowMenu(false); onDelete(column.id); }}
                className="w-full text-left px-4 py-2 text-[13px] text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40"
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
    <div className="px-2 pb-2 pt-1">
      <textarea
        autoFocus
        className="w-full px-3 py-2 bg-white dark:bg-dm-card rounded-lg text-[13px] text-[#1f2937] dark:text-dm-text resize-none focus:outline-none placeholder-[#8993a4] dark:placeholder-dm-soft shadow-sm border border-transparent focus:border-emerald-400"
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
          className="px-3 py-1.5 bg-[#15803d] text-white rounded-md text-[13px] font-medium hover:bg-[#16a34a] transition-colors"
        >Add card</button>
        <button
          type="button"
          onClick={onCancel}
          className="w-8 h-8 flex items-center justify-center text-[#626f86] dark:text-dm-soft hover:text-[#1f2937] dark:hover:text-dm-text rounded-md hover:bg-black/10 dark:hover:bg-white/10 text-lg leading-none"
        >✕</button>
      </div>
    </div>
  );
};

// ── BoardView ─────────────────────────────────────────────────────────────────
export const BoardView = ({ board, columns: initialColumns, boardId, mutations, onTicketOpen, highlightWbsNodeId, onHighlightConsumed }) => {
  const [columns, setColumns]             = useState(initialColumns);
  const [addingToColumn, setAddingToColumn] = useState(null);
  const [showAddList, setShowAddList]      = useState(false);
  const [newColName, setNewColName]        = useState('');
  const [pulseTicketId, setPulseTicketId]  = useState(null);
  const pendingMove = useRef(false);

  useEffect(() => {
    if (!highlightWbsNodeId) return;
    let found = null;
    for (const col of columns) {
      const t = (col.tickets || []).find(tk => tk.wbs_node_id === highlightWbsNodeId);
      if (t) { found = t; break; }
    }
    if (!found) return;

    setPulseTicketId(found.id);
    // Small delay to let the DOM settle before scrolling
    const scrollTimer = setTimeout(() => {
      document.querySelector(`[data-ticket-id="${found.id}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 200);
    const clearTimer = setTimeout(() => {
      setPulseTicketId(null);
      onHighlightConsumed?.();
    }, 2500);

    return () => { clearTimeout(scrollTimer); clearTimeout(clearTimer); };
  }, [highlightWbsNodeId, columns]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync server data into local state, but never while a move is in flight
  if (!pendingMove.current && JSON.stringify(initialColumns) !== JSON.stringify(columns)) {
    setColumns(initialColumns);
  }

  const handleDragStart = () => { pendingMove.current = true; };

  const handleDragEnd = (result) => {
    const { source, destination, type } = result;
    if (!destination || (source.droppableId === destination.droppableId && source.index === destination.index)) {
      pendingMove.current = false;
      return;
    }

    if (type === 'COLUMN') {
      const next = [...columns];
      const [moved] = next.splice(source.index, 1);
      next.splice(destination.index, 0, moved);

      const newPositions = next.map((col, i) => ({ ...col, position: (i + 1) * 1000 }));
      setColumns(newPositions);
      mutations.reorderColumns.mutate(
        newPositions.map(({ id, position }) => ({ id, position })),
        { onSettled: () => { pendingMove.current = false; } }
      );
      return;
    }

    // Reorder / move tickets
    const srcColIdx  = columns.findIndex((c) => c.id === source.droppableId);
    const dstColIdx  = columns.findIndex((c) => c.id === destination.droppableId);
    if (srcColIdx === -1 || dstColIdx === -1) { pendingMove.current = false; return; }

    const next = columns.map((c) => ({ ...c, tickets: [...(c.tickets || [])] }));
    const [movedTicket] = next[srcColIdx].tickets.splice(source.index, 1);

    next[dstColIdx].tickets.splice(destination.index, 0, movedTicket);

    const newPos = computePosition(
      next[dstColIdx].tickets.filter((t) => t.id !== movedTicket.id),
      destination.index
    );
    next[dstColIdx].tickets[destination.index] = { ...movedTicket, position: newPos, column_id: destination.droppableId };

    setColumns(next);

    mutations.moveTicket.mutate(
      { ticketId: movedTicket.id, data: { column_id: destination.droppableId, position: newPos } },
      { onSettled: () => { pendingMove.current = false; } }
    );
  };

  const handleAddTicket = async (columnId, title) => {
    await mutations.createTicket.mutateAsync({ column_id: columnId, title });
  };

  const handleRenameColumn = (columnId, name) => mutations.updateColumn.mutate({ columnId, data: { name } });
  const handleToggleIncludeInList = (columnId, include_in_list) => mutations.updateColumn.mutate({ columnId, data: { include_in_list } });

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
              <Draggable draggableId={`col-${String(col.id)}`} index={colIndex} key={col.id}>
                {(colProvided, colSnapshot) => (
                  <div
                    ref={colProvided.innerRef}
                    {...colProvided.draggableProps}
                    className={`flex-shrink-0 w-[272px] rounded-[8px] flex flex-col bg-[#ebecf0] dark:bg-dm-elevated ${
                      colSnapshot.isDragging ? 'shadow-2xl opacity-95 rotate-1' : ''
                    }`}
                    style={{ ...colProvided.draggableProps?.style, maxHeight: 'calc(100vh - 168px)' }}
                  >
                    {/* Header — drag handle */}
                    <div {...colProvided.dragHandleProps} className="cursor-grab active:cursor-grabbing">
                      <ColumnHeader
                        column={col}
                        ticketCount={col.tickets?.length ?? 0}
                        onRename={handleRenameColumn}
                        onDelete={handleDeleteColumn}
                        onAddTicket={(cid) => setAddingToColumn(cid)}
                        onToggleIncludeInList={handleToggleIncludeInList}
                      />
                    </div>

                    {/* Scrollable cards area */}
                    <Droppable droppableId={String(col.id)} type="TICKET">
                      {(tickProvided, tickSnapshot) => (
                        <div
                          ref={tickProvided.innerRef}
                          {...tickProvided.droppableProps}
                          className={`flex-1 overflow-y-auto overflow-x-hidden px-2 space-y-2 transition-colors scrollbar-hide ${
                            tickSnapshot.isDraggingOver ? 'bg-black/[0.06] dark:bg-white/[0.04] rounded-[4px]' : ''
                          }`}
                          style={{ minHeight: 8 }}
                        >
                          {(col.tickets || []).map((ticket, idx) => (
                            <Draggable draggableId={String(ticket.id)} index={idx} key={ticket.id}>
                              {(tp) => (
                                <div data-ticket-id={ticket.id}>
                                  <TicketCard
                                    ticket={ticket}
                                    innerRef={tp.innerRef}
                                    draggableProps={tp.draggableProps}
                                    dragHandleProps={tp.dragHandleProps}
                                    onOpen={() => onTicketOpen(ticket.id)}
                                    onToggleComplete={(ticketId, is_completed) =>
                                      mutations.updateTicket.mutate({ ticketId, data: { is_completed } })
                                    }
                                    isPulsed={pulseTicketId === ticket.id}
                                  />
                                </div>
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
                        className="flex items-center gap-1.5 w-full px-3 py-2.5 mt-0.5 text-[13px] font-medium text-[#44546f] dark:text-dm-soft hover:text-[#1f2937] dark:hover:text-dm-text hover:bg-black/5 dark:hover:bg-white/5 rounded-b-[8px] transition-colors flex-shrink-0"
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
                  className="w-full flex items-center gap-2 px-4 py-2.5 bg-white/20 hover:bg-white/30 text-white rounded-[8px] text-[13.5px] font-medium transition-colors backdrop-blur-sm"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="12" y1="5" x2="12" y2="19"/>
                    <line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  Add another list
                </button>
              ) : (
                <div className="bg-[#ebecf0] dark:bg-dm-elevated rounded-[8px] p-2 space-y-2">
                  <input
                    autoFocus
                    className="w-full px-3 py-2 bg-white dark:bg-dm-card rounded-lg text-[13px] text-[#1f2937] dark:text-dm-text focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
                    placeholder="Enter list name…"
                    value={newColName}
                    onChange={(e) => setNewColName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddList(); if (e.key === 'Escape') { setShowAddList(false); setNewColName(''); } }}
                  />
                  <div className="flex gap-2 items-center">
                    <button
                      type="button"
                      onClick={handleAddList}
                      className="px-3 py-1.5 bg-[#15803d] text-white rounded-md text-[13px] font-medium hover:bg-[#16a34a]"
                    >Add list</button>
                    <button
                      type="button"
                      onClick={() => { setShowAddList(false); setNewColName(''); }}
                      className="w-8 h-8 flex items-center justify-center text-[#626f86] dark:text-dm-soft hover:text-[#1f2937] dark:hover:text-dm-text text-lg rounded-md hover:bg-black/10 dark:hover:bg-white/10"
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
