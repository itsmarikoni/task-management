package com.example.taskmanagement.dto;

import jakarta.validation.constraints.NotNull;

public record CardPositionUpdateRequest(
		@NotNull Long columnId,
		Long afterCardId) {

}
