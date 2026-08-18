package com.example.taskmanagement.service;

import com.example.taskmanagement.dto.CardResponse;
import com.example.taskmanagement.dto.ColumnResponse;
import com.example.taskmanagement.repository.BoardColumnRepository;
import com.example.taskmanagement.repository.CardRepository;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class ColumnService {

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

}
