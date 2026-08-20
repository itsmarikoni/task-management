package com.example.taskmanagement.controller;

import com.example.taskmanagement.dto.CardResponse;
import com.example.taskmanagement.dto.CardSortRequest;
import com.example.taskmanagement.dto.ColumnCreateRequest;
import com.example.taskmanagement.dto.ColumnResponse;
import com.example.taskmanagement.dto.ColumnUpdateRequest;
import com.example.taskmanagement.service.ColumnService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/columns")
public class ColumnController {

	private final ColumnService columnService;

	public ColumnController(ColumnService columnService) {
		this.columnService = columnService;
	}

	@GetMapping
	public List<ColumnResponse> listColumns() {
		return columnService.listColumns();
	}

	@GetMapping("/{columnId}/cards")
	public List<CardResponse> listCardsByColumn(@PathVariable Long columnId) {
		return columnService.listCardsByColumn(columnId);
	}

	@PatchMapping("/{columnId}/cards/sort")
	public List<CardResponse> sortCardsByColumn(@PathVariable Long columnId, @Valid @RequestBody CardSortRequest request) {
		return columnService.sortCardsByColumn(columnId, request);
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	public ColumnResponse createColumn(@Valid @RequestBody ColumnCreateRequest request) {
		return columnService.createColumn(request);
	}

	@PutMapping("/{id}")
	public ColumnResponse updateColumn(@PathVariable Long id, @Valid @RequestBody ColumnUpdateRequest request) {
		return columnService.updateColumn(id, request);
	}

	@DeleteMapping("/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void deleteColumn(@PathVariable Long id) {
		columnService.deleteColumn(id);
	}

}
