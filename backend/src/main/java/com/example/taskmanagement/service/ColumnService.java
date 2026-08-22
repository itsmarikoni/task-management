package com.example.taskmanagement.service;

import com.example.taskmanagement.dto.CardResponse;
import com.example.taskmanagement.dto.CardSortRequest;
import com.example.taskmanagement.dto.CardSortRequest.CardSortKey;
import com.example.taskmanagement.dto.ColumnCreateRequest;
import com.example.taskmanagement.dto.ColumnResponse;
import com.example.taskmanagement.dto.ColumnUpdateRequest;
import com.example.taskmanagement.entity.BoardColumn;
import com.example.taskmanagement.entity.Card;
import com.example.taskmanagement.repository.BoardColumnRepository;
import com.example.taskmanagement.repository.CardRepository;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ColumnService {

	// CardCreateRequest/CardUpdateRequest の @Pattern(regexp = "高|中|低") と対応する値のセット
	private static final Map<String, Integer> PRIORITY_ORDER = Map.of("高", 0, "中", 1, "低", 2);

	private final BoardColumnRepository boardColumnRepository;
	private final CardRepository cardRepository;

	public ColumnService(BoardColumnRepository boardColumnRepository, CardRepository cardRepository) {
		this.boardColumnRepository = boardColumnRepository;
		this.cardRepository = cardRepository;
	}

	public List<ColumnResponse> listColumns() {
		return boardColumnRepository.findAllByOrderByDisplayOrderAsc().stream()
				.map(ColumnResponse::from)
				.toList();
	}

	public List<CardResponse> listCardsByColumn(Long columnId) {
		return cardRepository.findAllByColumnIdOrderByDisplayOrderAsc(columnId).stream()
				.map(CardResponse::from)
				.toList();
	}

	@Transactional
	public List<CardResponse> sortCardsByColumn(Long columnId, CardSortRequest request) {
		if (!boardColumnRepository.existsById(columnId)) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Column not found: " + columnId);
		}

		List<Card> cards = cardRepository.findAllByColumnIdOrderByDisplayOrderAsc(columnId);
		Comparator<Card> comparator = request.sortKey() == CardSortKey.PRIORITY
				? Comparator.comparingInt(card -> PRIORITY_ORDER.getOrDefault(card.getPriority(), Integer.MAX_VALUE))
				: Comparator.comparing(Card::getDueDate, Comparator.nullsLast(Comparator.naturalOrder()));

		List<Card> sorted = cards.stream().sorted(comparator).toList();
		for (int i = 0; i < sorted.size(); i++) {
			sorted.get(i).setDisplayOrder(i);
		}
		cardRepository.saveAll(sorted);

		return sorted.stream().map(CardResponse::from).toList();
	}

	@Transactional
	public ColumnResponse createColumn(ColumnCreateRequest request) {
		int nextDisplayOrder = boardColumnRepository.findFirstByOrderByDisplayOrderDesc()
				.map(column -> column.getDisplayOrder() + 1)
				.orElse(0);

		BoardColumn column = new BoardColumn();
		column.setName(request.name());
		column.setDisplayOrder(nextDisplayOrder);

		return ColumnResponse.from(boardColumnRepository.save(column));
	}

	public ColumnResponse updateColumn(Long id, ColumnUpdateRequest request) {
		BoardColumn column = boardColumnRepository.findById(id)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Column not found: " + id));

		column.setName(request.name());

		return ColumnResponse.from(boardColumnRepository.save(column));
	}

	public void deleteColumn(Long id) {
		if (!boardColumnRepository.existsById(id)) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Column not found: " + id);
		}
		boardColumnRepository.deleteById(id);
	}

}
