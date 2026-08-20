package com.example.taskmanagement.service;

import com.example.taskmanagement.dto.CardResponse;
import com.example.taskmanagement.dto.CardSortRequest;
import com.example.taskmanagement.dto.CardSortRequest.CardSortKey;
import com.example.taskmanagement.dto.ColumnResponse;
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

}
