package com.example.taskmanagement.controller;

import com.example.taskmanagement.dto.CardResponse;
import com.example.taskmanagement.dto.CardSortRequest;
import com.example.taskmanagement.dto.ColumnResponse;
import com.example.taskmanagement.service.ColumnService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
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

}
