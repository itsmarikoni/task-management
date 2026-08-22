package com.example.taskmanagement.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.example.taskmanagement.dto.CardResponse;
import com.example.taskmanagement.exception.GlobalExceptionHandler;
import com.example.taskmanagement.service.CardService;
import java.time.LocalDate;
import java.time.LocalDateTime;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.server.ResponseStatusException;

@WebMvcTest(CardController.class)
@Import(GlobalExceptionHandler.class)
class CardControllerTest {

	@Autowired
	private MockMvc mockMvc;

	@MockitoBean
	private CardService cardService;

	@Test
	void カード取得に成功すると200とカード情報が返る() throws Exception {
		CardResponse response = new CardResponse(1L, 1L, "タイトル", "説明", "高",
				LocalDate.of(2026, 1, 1), 0, LocalDateTime.now(), LocalDateTime.now());
		when(cardService.getCard(1L)).thenReturn(response);

		mockMvc.perform(get("/api/cards/1"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.title").value("タイトル"));
	}

	@Test
	void 存在しないカードを取得すると404が返る() throws Exception {
		when(cardService.getCard(anyLong()))
				.thenThrow(new ResponseStatusException(HttpStatus.NOT_FOUND, "Card not found: 999"));

		mockMvc.perform(get("/api/cards/999"))
				.andExpect(status().isNotFound());
	}

	@Test
	void priorityが不正な値だとカード作成が400になる() throws Exception {
		String body = """
				{"columnId":1,"title":"タイトル","description":"","priority":"不正な値","dueDate":null}
				""";

		mockMvc.perform(post("/api/cards").contentType(MediaType.APPLICATION_JSON).content(body))
				.andExpect(status().isBadRequest());
	}

	@Test
	void タイトル未入力だとカード作成が400になる() throws Exception {
		String body = """
				{"columnId":1,"title":"","description":"","priority":"高","dueDate":null}
				""";

		mockMvc.perform(post("/api/cards").contentType(MediaType.APPLICATION_JSON).content(body))
				.andExpect(status().isBadRequest());
	}

	@Test
	void 有効なリクエストでカード作成が201になる() throws Exception {
		CardResponse response = new CardResponse(1L, 1L, "タイトル", "", "高",
				null, 0, LocalDateTime.now(), LocalDateTime.now());
		when(cardService.createCard(any())).thenReturn(response);

		String body = """
				{"columnId":1,"title":"タイトル","description":"","priority":"高","dueDate":null}
				""";

		mockMvc.perform(post("/api/cards").contentType(MediaType.APPLICATION_JSON).content(body))
				.andExpect(status().isCreated());
	}

	@Test
	void カード削除に成功すると204が返る() throws Exception {
		mockMvc.perform(delete("/api/cards/1"))
				.andExpect(status().isNoContent());
	}

}
