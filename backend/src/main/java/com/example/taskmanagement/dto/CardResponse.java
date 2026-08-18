package com.example.taskmanagement.dto;

import com.example.taskmanagement.entity.Card;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record CardResponse(
		Long id,
		Long columnId,
		String title,
		String description,
		String priority,
		LocalDate dueDate,
		Integer displayOrder,
		LocalDateTime createdAt,
		LocalDateTime updatedAt) {

	public static CardResponse from(Card card) {
		return new CardResponse(
				card.getId(),
				card.getColumn().getId(),
				card.getTitle(),
				card.getDescription(),
				card.getPriority(),
				card.getDueDate(),
				card.getDisplayOrder(),
				card.getCreatedAt(),
				card.getUpdatedAt());
	}

}
