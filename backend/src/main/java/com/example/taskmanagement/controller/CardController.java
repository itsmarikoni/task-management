package com.example.taskmanagement.controller;

import com.example.taskmanagement.dto.CardResponse;
import com.example.taskmanagement.service.CardService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/cards")
public class CardController {

	private final CardService cardService;

	public CardController(CardService cardService) {
		this.cardService = cardService;
	}

	@GetMapping("/{id}")
	public CardResponse getCard(@PathVariable Long id) {
		return cardService.getCard(id);
	}

}
