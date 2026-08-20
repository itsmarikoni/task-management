package com.example.taskmanagement.dto;

import jakarta.validation.constraints.NotNull;

public record CardSortRequest(
		@NotNull CardSortKey sortKey) {

	public enum CardSortKey {
		PRIORITY,
		DUE_DATE
	}

}
