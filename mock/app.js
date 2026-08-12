(() => {
  const STORAGE_KEY = 'trello-mock-board';

  const initialState = () => ({
    columns: [
      {
        id: 'col-1',
        name: '未着手',
        cards: [
          { id: 'card-1', title: '要件定義書を読む', description: '', priority: '高', dueDate: '' },
          { id: 'card-2', title: 'モックの認識合わせ', description: '', priority: '中', dueDate: '' },
        ],
      },
      {
        id: 'col-2',
        name: '進行中',
        cards: [
          { id: 'card-3', title: '画面設計のレビュー', description: '', priority: '中', dueDate: '' },
        ],
      },
      {
        id: 'col-3',
        name: '完了',
        cards: [
          { id: 'card-4', title: 'データ設計の確認', description: '', priority: '低', dueDate: '' },
        ],
      },
    ],
  });

  function loadState() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialState();
    try {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.columns)) return parsed;
    } catch (e) {
      // fall through to default
    }
    return initialState();
  }

  let state = loadState();
  let openMenuColumnId = null;
  let isAddingColumn = false;

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function uid(prefix) {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  // ---- DOM refs ----
  const boardEl = document.getElementById('board');
  const addColumnBtn = document.getElementById('add-column-btn');

  const cardModal = document.getElementById('card-modal');
  const cardTitleInput = document.getElementById('card-title');
  const cardDescInput = document.getElementById('card-description');
  const cardPriorityInput = document.getElementById('card-priority');
  const cardDueDateInput = document.getElementById('card-due-date');
  const cardSaveBtn = document.getElementById('card-save-btn');
  const cardDeleteBtn = document.getElementById('card-delete-btn');
  const cardCloseBtn = document.getElementById('card-close-btn');

  const confirmModal = document.getElementById('confirm-modal');
  const confirmMessage = document.getElementById('confirm-message');
  const confirmOkBtn = document.getElementById('confirm-ok-btn');
  const confirmCancelBtn = document.getElementById('confirm-cancel-btn');

  // context for currently open modals
  let editingCardContext = null; // { columnId, cardId | null }
  let pendingDelete = null; // { type: 'card'|'column', columnId, cardId? }

  // ---- Rendering ----
  function render() {
    boardEl.innerHTML = '';

    state.columns.forEach((column) => {
      boardEl.appendChild(renderColumn(column));
    });

    if (isAddingColumn) {
      boardEl.appendChild(renderAddColumnInline());
    }
  }

  function renderColumn(column) {
    const columnEl = document.createElement('div');
    columnEl.className = 'column';
    columnEl.dataset.columnId = column.id;

    // header
    const header = document.createElement('div');
    header.className = 'column-header';

    const titleEl = document.createElement('div');
    titleEl.className = 'column-title';
    titleEl.textContent = column.name;
    header.appendChild(titleEl);

    const countEl = document.createElement('span');
    countEl.className = 'column-count';
    countEl.textContent = column.cards.length;
    header.appendChild(countEl);

    const menuWrap = document.createElement('div');
    menuWrap.className = 'column-menu-wrap';

    const menuBtn = document.createElement('button');
    menuBtn.className = 'icon-btn';
    menuBtn.textContent = '…';
    menuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openMenuColumnId = openMenuColumnId === column.id ? null : column.id;
      render();
    });
    menuWrap.appendChild(menuBtn);

    if (openMenuColumnId === column.id) {
      const menu = document.createElement('div');
      menu.className = 'column-menu';

      const renameBtn = document.createElement('button');
      renameBtn.textContent = '名前を変更';
      renameBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openMenuColumnId = null;
        startColumnRename(column);
      });
      menu.appendChild(renameBtn);

      const sortPriorityBtn = document.createElement('button');
      sortPriorityBtn.textContent = '優先度順に並び替え';
      sortPriorityBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openMenuColumnId = null;
        sortColumnCards(column, 'priority');
      });
      menu.appendChild(sortPriorityBtn);

      const sortDueDateBtn = document.createElement('button');
      sortDueDateBtn.textContent = '期限順に並び替え';
      sortDueDateBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openMenuColumnId = null;
        sortColumnCards(column, 'dueDate');
      });
      menu.appendChild(sortDueDateBtn);

      const deleteBtn = document.createElement('button');
      deleteBtn.textContent = 'カラムを削除';
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openMenuColumnId = null;
        pendingDelete = { type: 'column', columnId: column.id };
        confirmMessage.textContent = `カラム「${column.name}」を削除しますか？中のカードもすべて削除されます。この操作は取り消せません。`;
        showModal(confirmModal);
      });
      menu.appendChild(deleteBtn);

      menuWrap.appendChild(menu);
    }

    header.appendChild(menuWrap);
    columnEl.appendChild(header);

    // card list
    const cardList = document.createElement('div');
    cardList.className = 'card-list';
    cardList.dataset.columnId = column.id;

    cardList.addEventListener('dragover', (e) => {
      e.preventDefault();
      cardList.classList.add('drag-over');
    });
    cardList.addEventListener('dragleave', () => {
      cardList.classList.remove('drag-over');
    });
    cardList.addEventListener('drop', (e) => {
      e.preventDefault();
      cardList.classList.remove('drag-over');
      handleDrop(column.id, e);
    });

    column.cards.forEach((card) => {
      cardList.appendChild(renderCard(column, card));
    });

    columnEl.appendChild(cardList);

    // add card button
    const addCardBtn = document.createElement('button');
    addCardBtn.className = 'add-card-btn';
    addCardBtn.textContent = '＋ カード追加';
    addCardBtn.addEventListener('click', () => openCardModalForCreate(column.id));
    columnEl.appendChild(addCardBtn);

    return columnEl;
  }

  function renderCard(column, card) {
    const cardEl = document.createElement('div');
    cardEl.className = `card priority-${card.priority}`;
    cardEl.draggable = true;
    cardEl.dataset.cardId = card.id;
    cardEl.dataset.columnId = column.id;

    const titleEl = document.createElement('p');
    titleEl.className = 'card-title';
    titleEl.textContent = card.title;
    cardEl.appendChild(titleEl);

    const meta = document.createElement('div');
    meta.className = 'card-meta';

    const priorityBadge = document.createElement('span');
    priorityBadge.className = 'badge';
    priorityBadge.textContent = `優先度: ${card.priority}`;
    meta.appendChild(priorityBadge);

    if (card.dueDate) {
      const dueBadge = document.createElement('span');
      dueBadge.className = 'badge';
      dueBadge.textContent = card.dueDate;
      meta.appendChild(dueBadge);
    }

    cardEl.appendChild(meta);

    cardEl.addEventListener('click', () => openCardModalForEdit(column.id, card.id));

    cardEl.addEventListener('dragstart', (e) => {
      cardEl.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', JSON.stringify({ columnId: column.id, cardId: card.id }));
    });
    cardEl.addEventListener('dragend', () => {
      cardEl.classList.remove('dragging');
    });

    return cardEl;
  }

  function renderAddColumnInline() {
    const wrap = document.createElement('div');
    wrap.className = 'add-column-inline';

    const input = document.createElement('input');
    input.className = 'inline-input';
    input.placeholder = 'カラム名を入力';
    wrap.appendChild(input);

    let committed = false;
    const commit = () => {
      if (committed) return;
      committed = true;
      const name = input.value.trim();
      if (name) {
        state.columns.push({ id: uid('col'), name, cards: [] });
        saveState();
      }
      isAddingColumn = false;
      render();
    };
    const cancel = () => {
      if (committed) return;
      committed = true;
      isAddingColumn = false;
      render();
    };

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') commit();
      if (e.key === 'Escape') cancel();
    });
    input.addEventListener('blur', commit);

    setTimeout(() => input.focus(), 0);

    return wrap;
  }

  const PRIORITY_ORDER = { '高': 0, '中': 1, '低': 2 };

  function sortColumnCards(column, key) {
    if (key === 'priority') {
      column.cards.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
    } else if (key === 'dueDate') {
      column.cards.sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate.localeCompare(b.dueDate);
      });
    }
    saveState();
    render();
  }

  function startColumnRename(column) {
    render();
    const columnEl = boardEl.querySelector(`.column[data-column-id="${column.id}"] .column-header`);
    if (!columnEl) return;
    const titleEl = columnEl.querySelector('.column-title');
    const input = document.createElement('input');
    input.className = 'inline-input';
    input.value = column.name;
    titleEl.replaceWith(input);
    input.focus();
    input.select();

    const commit = () => {
      const name = input.value.trim();
      if (name) {
        column.name = name;
        saveState();
      }
      render();
    };

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') commit();
      if (e.key === 'Escape') render();
    });
    input.addEventListener('blur', commit);
  }

  function handleDrop(targetColumnId, e) {
    const data = e.dataTransfer.getData('text/plain');
    if (!data) return;
    const { columnId: sourceColumnId, cardId } = JSON.parse(data);

    const sourceColumn = state.columns.find((c) => c.id === sourceColumnId);
    const targetColumn = state.columns.find((c) => c.id === targetColumnId);
    if (!sourceColumn || !targetColumn) return;

    const cardIndex = sourceColumn.cards.findIndex((c) => c.id === cardId);
    if (cardIndex === -1) return;
    const [card] = sourceColumn.cards.splice(cardIndex, 1);

    // determine drop position within target column based on mouse Y
    const cardList = boardEl.querySelector(`.card-list[data-column-id="${targetColumnId}"]`);
    const cardEls = [...cardList.querySelectorAll('.card')];
    let insertIndex = targetColumn.cards.length;
    for (let i = 0; i < cardEls.length; i++) {
      const rect = cardEls[i].getBoundingClientRect();
      if (e.clientY < rect.top + rect.height / 2) {
        insertIndex = i;
        break;
      }
    }

    targetColumn.cards.splice(insertIndex, 0, card);
    saveState();
    render();
  }

  // ---- Card modal ----
  function openCardModalForCreate(columnId) {
    editingCardContext = { columnId, cardId: null };
    cardTitleInput.value = '';
    cardDescInput.value = '';
    cardPriorityInput.value = '中';
    cardDueDateInput.value = '';
    cardDeleteBtn.style.display = 'none';
    showModal(cardModal);
    cardTitleInput.focus();
  }

  function openCardModalForEdit(columnId, cardId) {
    const column = state.columns.find((c) => c.id === columnId);
    const card = column.cards.find((c) => c.id === cardId);
    if (!card) return;
    editingCardContext = { columnId, cardId };
    cardTitleInput.value = card.title;
    cardDescInput.value = card.description || '';
    cardPriorityInput.value = card.priority;
    cardDueDateInput.value = card.dueDate || '';
    cardDeleteBtn.style.display = '';
    showModal(cardModal);
  }

  cardSaveBtn.addEventListener('click', () => {
    if (!editingCardContext) return;
    const title = cardTitleInput.value.trim();
    if (!title) {
      cardTitleInput.focus();
      return;
    }
    const { columnId, cardId } = editingCardContext;
    const column = state.columns.find((c) => c.id === columnId);
    if (!column) return;

    if (cardId) {
      const card = column.cards.find((c) => c.id === cardId);
      card.title = title;
      card.description = cardDescInput.value;
      card.priority = cardPriorityInput.value;
      card.dueDate = cardDueDateInput.value;
    } else {
      column.cards.push({
        id: uid('card'),
        title,
        description: cardDescInput.value,
        priority: cardPriorityInput.value,
        dueDate: cardDueDateInput.value,
      });
    }
    saveState();
    hideModal(cardModal);
    render();
  });

  cardDeleteBtn.addEventListener('click', () => {
    if (!editingCardContext || !editingCardContext.cardId) return;
    pendingDelete = { type: 'card', columnId: editingCardContext.columnId, cardId: editingCardContext.cardId };
    confirmMessage.textContent = 'このカードを削除しますか？この操作は取り消せません。';
    showModal(confirmModal);
  });

  cardCloseBtn.addEventListener('click', () => {
    editingCardContext = null;
    hideModal(cardModal);
  });

  // ---- Confirm modal ----
  confirmCancelBtn.addEventListener('click', () => {
    pendingDelete = null;
    hideModal(confirmModal);
  });

  confirmOkBtn.addEventListener('click', () => {
    if (!pendingDelete) {
      hideModal(confirmModal);
      return;
    }
    if (pendingDelete.type === 'column') {
      state.columns = state.columns.filter((c) => c.id !== pendingDelete.columnId);
    } else if (pendingDelete.type === 'card') {
      const column = state.columns.find((c) => c.id === pendingDelete.columnId);
      if (column) {
        column.cards = column.cards.filter((c) => c.id !== pendingDelete.cardId);
      }
      // card modal was the caller; close it too
      editingCardContext = null;
      hideModal(cardModal);
    }
    saveState();
    pendingDelete = null;
    hideModal(confirmModal);
    render();
  });

  // ---- Modal helpers ----
  function showModal(modalEl) {
    modalEl.classList.remove('hidden');
  }
  function hideModal(modalEl) {
    modalEl.classList.add('hidden');
  }

  // close menus when clicking outside
  document.addEventListener('click', () => {
    if (openMenuColumnId !== null) {
      openMenuColumnId = null;
      render();
    }
  });

  addColumnBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    isAddingColumn = true;
    render();
  });

  render();
})();
