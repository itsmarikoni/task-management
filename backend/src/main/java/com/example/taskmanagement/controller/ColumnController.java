package com.example.taskmanagement.controller;

import com.example.taskmanagement.dto.CardResponse;
import com.example.taskmanagement.dto.ColumnResponse;
import com.example.taskmanagement.service.ColumnService;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
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

}
