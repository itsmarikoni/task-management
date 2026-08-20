package com.example.taskmanagement.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ColumnUpdateRequest(
		@NotBlank @Size(max = 50) String name) {

}
