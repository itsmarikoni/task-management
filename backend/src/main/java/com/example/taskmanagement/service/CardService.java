package com.example.taskmanagement.service;

import com.example.taskmanagement.dto.CardResponse;
import com.example.taskmanagement.repository.CardRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class CardService {

	private final CardRepository cardRepository;

	public CardService(CardRepository cardRepository) {
		this.cardRepository = cardRepository;
	}

	public CardResponse getCard(Long id) {
		return cardRepository.findById(id)
				.map(CardResponse::from)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Card not found: " + id));
	}

}
