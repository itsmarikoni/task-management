package com.example.taskmanagement.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public record CardCreateRequest(
		@NotNull Long columnId,
		@NotBlank @Size(max = 100) String title,
		String description,
		@NotBlank @Size(max = 10) String priority,
		LocalDate dueDate) {

}
