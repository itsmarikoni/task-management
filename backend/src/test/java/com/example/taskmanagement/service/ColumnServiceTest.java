package com.example.taskmanagement.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.when;

import com.example.taskmanagement.dto.CardSortRequest;
import com.example.taskmanagement.dto.CardSortRequest.CardSortKey;
import com.example.taskmanagement.entity.BoardColumn;
import com.example.taskmanagement.entity.Card;
import com.example.taskmanagement.repository.BoardColumnRepository;
import com.example.taskmanagement.repository.CardRepository;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class ColumnServiceTest {

	@Mock
	private BoardColumnRepository boardColumnRepository;

	@Mock
	private CardRepository cardRepository;

	@InjectMocks
	private ColumnService columnService;

	private BoardColumn column;

	@BeforeEach
	void setUp() {
		column = new BoardColumn();
		setId(column, 1L);
	}

	@Test
	void 優先度順に並び替えできる() {
		Card low = newCard(1L, "低", null);
		Card high = newCard(2L, "高", null);
		Card medium = newCard(3L, "中", null);

		when(boardColumnRepository.existsById(1L)).thenReturn(true);
		when(cardRepository.findAllByColumnIdOrderByDisplayOrderAsc(1L))
				.thenReturn(List.of(low, high, medium));
		when(cardRepository.saveAll(anyList())).thenAnswer(invocation -> invocation.getArgument(0));

		var response = columnService.sortCardsByColumn(1L, new CardSortRequest(CardSortKey.PRIORITY));

		assertThat(response).extracting("id").containsExactly(2L, 3L, 1L);
		assertThat(high.getDisplayOrder()).isEqualTo(0);
		assertThat(medium.getDisplayOrder()).isEqualTo(1);
		assertThat(low.getDisplayOrder()).isEqualTo(2);
	}

	@Test
	void 期限順に並び替えできる_期限なしは最後() {
		Card noDue = newCard(1L, "中", null);
		Card earlyDue = newCard(2L, "中", LocalDate.of(2026, 1, 1));
		Card lateDue = newCard(3L, "中", LocalDate.of(2026, 6, 1));

		when(boardColumnRepository.existsById(1L)).thenReturn(true);
		when(cardRepository.findAllByColumnIdOrderByDisplayOrderAsc(1L))
				.thenReturn(List.of(noDue, earlyDue, lateDue));
		when(cardRepository.saveAll(anyList())).thenAnswer(invocation -> invocation.getArgument(0));

		var response = columnService.sortCardsByColumn(1L, new CardSortRequest(CardSortKey.DUE_DATE));

		assertThat(response).extracting("id").containsExactly(2L, 3L, 1L);
	}

	@Test
	void 存在しないカラムを指定すると404が返る() {
		when(boardColumnRepository.existsById(999L)).thenReturn(false);

		assertThatThrownBy(() -> columnService.sortCardsByColumn(999L, new CardSortRequest(CardSortKey.PRIORITY)))
				.isInstanceOf(ResponseStatusException.class)
				.hasMessageContaining("Column not found");
	}

	private Card newCard(Long id, String priority, LocalDate dueDate) {
		Card card = new Card();
		setId(card, id);
		card.setColumn(column);
		card.setPriority(priority);
		card.setDueDate(dueDate);
		card.setDisplayOrder(0);
		return card;
	}

	private void setId(Object entity, Long id) {
		try {
			var field = entity.getClass().getDeclaredField("id");
			field.setAccessible(true);
			field.set(entity, id);
		} catch (ReflectiveOperationException e) {
			throw new RuntimeException(e);
		}
	}

}
