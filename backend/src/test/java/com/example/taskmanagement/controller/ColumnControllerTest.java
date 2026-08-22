package com.example.taskmanagement.controller;

import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.example.taskmanagement.exception.GlobalExceptionHandler;
import com.example.taskmanagement.service.ColumnService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.server.ResponseStatusException;

@WebMvcTest(ColumnController.class)
@Import(GlobalExceptionHandler.class)
class ColumnControllerTest {

	@Autowired
	private MockMvc mockMvc;

	@MockitoBean
	private ColumnService columnService;

	@Test
	void カラム名未入力だと作成が400になる() throws Exception {
		String body = """
				{"name":""}
				""";

		mockMvc.perform(post("/api/columns").contentType(MediaType.APPLICATION_JSON).content(body))
				.andExpect(status().isBadRequest());
	}

	@Test
	void 存在しないカラムを削除すると404が返る() throws Exception {
		org.mockito.Mockito.doThrow(new ResponseStatusException(HttpStatus.NOT_FOUND, "Column not found: 999"))
				.when(columnService).deleteColumn(anyLong());

		mockMvc.perform(delete("/api/columns/999"))
				.andExpect(status().isNotFound());
	}

	@Test
	void カラム一覧取得は200が返る() throws Exception {
		when(columnService.listColumns()).thenReturn(java.util.List.of());

		mockMvc.perform(get("/api/columns"))
				.andExpect(status().isOk());
	}

}
