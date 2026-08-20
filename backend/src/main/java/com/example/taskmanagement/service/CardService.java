package com.example.taskmanagement.service;

import com.example.taskmanagement.dto.CardCreateRequest;
import com.example.taskmanagement.dto.CardResponse;
import com.example.taskmanagement.entity.BoardColumn;
import com.example.taskmanagement.entity.Card;
import com.example.taskmanagement.repository.BoardColumnRepository;
import com.example.taskmanagement.repository.CardRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class CardService {

	private final CardRepository cardRepository;
	private final BoardColumnRepository boardColumnRepository;

	public CardService(CardRepository cardRepository, BoardColumnRepository boardColumnRepository) {
		this.cardRepository = cardRepository;
		this.boardColumnRepository = boardColumnRepository;
	}

	public CardResponse getCard(Long id) {
		return cardRepository.findById(id)
				.map(CardResponse::from)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Card not found: " + id));
	}

	public CardResponse createCard(CardCreateRequest request) {
		BoardColumn column = boardColumnRepository.findById(request.columnId())
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
						"Column not found: " + request.columnId()));

		int nextDisplayOrder = cardRepository.findFirstByColumnIdOrderByDisplayOrderDesc(request.columnId())
				.map(card -> card.getDisplayOrder() + 1)
				.orElse(0);

		Card card = new Card();
		card.setColumn(column);
		card.setTitle(request.title());
		card.setDescription(request.description());
		card.setPriority(request.priority());
		card.setDueDate(request.dueDate());
		card.setDisplayOrder(nextDisplayOrder);

		return CardResponse.from(cardRepository.save(card));
	}

}
