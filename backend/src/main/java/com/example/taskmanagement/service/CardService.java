package com.example.taskmanagement.service;

import com.example.taskmanagement.dto.CardCreateRequest;
import com.example.taskmanagement.dto.CardPositionUpdateRequest;
import com.example.taskmanagement.dto.CardResponse;
import com.example.taskmanagement.dto.CardUpdateRequest;
import com.example.taskmanagement.entity.BoardColumn;
import com.example.taskmanagement.entity.Card;
import com.example.taskmanagement.repository.BoardColumnRepository;
import com.example.taskmanagement.repository.CardRepository;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
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

	public CardResponse updateCard(Long id, CardUpdateRequest request) {
		Card card = cardRepository.findById(id)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Card not found: " + id));

		boolean columnChanged = !card.getColumn().getId().equals(request.columnId());

		if (columnChanged) {
			BoardColumn column = boardColumnRepository.findById(request.columnId())
					.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
							"Column not found: " + request.columnId()));

			int nextDisplayOrder = cardRepository.findFirstByColumnIdOrderByDisplayOrderDesc(request.columnId())
					.map(c -> c.getDisplayOrder() + 1)
					.orElse(0);

			card.setColumn(column);
			card.setDisplayOrder(nextDisplayOrder);
		}

		card.setTitle(request.title());
		card.setDescription(request.description());
		card.setPriority(request.priority());
		card.setDueDate(request.dueDate());

		return CardResponse.from(cardRepository.save(card));
	}

	@Transactional
	public CardResponse updateCardPosition(Long id, CardPositionUpdateRequest request) {
		Card card = cardRepository.findById(id)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Card not found: " + id));

		BoardColumn column = boardColumnRepository.findById(request.columnId())
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
						"Column not found: " + request.columnId()));

		List<Card> destinationCards = cardRepository.findAllByColumnIdOrderByDisplayOrderAsc(request.columnId())
				.stream()
				.filter(c -> !c.getId().equals(card.getId()))
				.collect(Collectors.toCollection(ArrayList::new));

		int insertIndex;
		if (request.afterCardId() == null) {
			insertIndex = 0;
		} else {
			int afterIndex = -1;
			for (int i = 0; i < destinationCards.size(); i++) {
				if (destinationCards.get(i).getId().equals(request.afterCardId())) {
					afterIndex = i;
					break;
				}
			}
			if (afterIndex == -1) {
				throw new ResponseStatusException(HttpStatus.NOT_FOUND,
						"Card not found: " + request.afterCardId());
			}
			insertIndex = afterIndex + 1;
		}

		destinationCards.add(insertIndex, card);
		card.setColumn(column);

		for (int i = 0; i < destinationCards.size(); i++) {
			destinationCards.get(i).setDisplayOrder(i);
		}
		cardRepository.saveAll(destinationCards);

		return CardResponse.from(card);
	}

	public void deleteCard(Long id) {
		if (!cardRepository.existsById(id)) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Card not found: " + id);
		}
		cardRepository.deleteById(id);
	}

}
