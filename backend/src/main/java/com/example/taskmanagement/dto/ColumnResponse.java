package com.example.taskmanagement.dto;

import com.example.taskmanagement.entity.BoardColumn;
import java.time.LocalDateTime;

public record ColumnResponse(
		Long id,
		String name,
		Integer displayOrder,
		LocalDateTime createdAt,
		LocalDateTime updatedAt) {

	public static ColumnResponse from(BoardColumn column) {
		return new ColumnResponse(
				column.getId(),
				column.getName(),
				column.getDisplayOrder(),
				column.getCreatedAt(),
				column.getUpdatedAt());
	}

}
