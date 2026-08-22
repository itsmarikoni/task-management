package com.example.taskmanagement.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public record CardUpdateRequest(
		@NotNull Long columnId,
		@NotBlank @Size(max = 100) String title,
		String description,
		@NotBlank @Pattern(regexp = "高|中|低", message = "priority must be one of 高, 中, 低") String priority,
		LocalDate dueDate) {

}
