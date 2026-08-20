package com.example.taskmanagement.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.example.taskmanagement.dto.CardPositionUpdateRequest;
import com.example.taskmanagement.dto.CardUpdateRequest;
import com.example.taskmanagement.entity.BoardColumn;
import com.example.taskmanagement.entity.Card;
import com.example.taskmanagement.repository.BoardColumnRepository;
import com.example.taskmanagement.repository.CardRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class CardServiceTest {

	@Mock
	private CardRepository cardRepository;

	@Mock
	private BoardColumnRepository boardColumnRepository;

	@InjectMocks
	private CardService cardService;

	private BoardColumn column;
	private Card card;
	private Card cardA;
	private Card cardB;
	private Card cardC;

	@BeforeEach
	void setUp() {
		column = new BoardColumn();
		setId(column, 1L);

		card = new Card();
		setId(card, 10L);
		card.setColumn(column);
		card.setTitle("旧タイトル");
		card.setDescription("旧説明");
		card.setPriority("low");
		card.setDueDate(LocalDate.of(2026, 1, 1));
		card.setDisplayOrder(0);

		cardA = newCard(10L, column, 0);
		cardB = newCard(11L, column, 1);
		cardC = newCard(12L, column, 2);
	}

	@Test
	void 存在するカードを同じカラム内で更新できる() {
		CardUpdateRequest request = new CardUpdateRequest(1L, "新タイトル", "新説明", "high", LocalDate.of(2026, 2, 1));
		when(cardRepository.findById(10L)).thenReturn(Optional.of(card));
		when(cardRepository.save(any(Card.class))).thenAnswer(invocation -> invocation.getArgument(0));

		var response = cardService.updateCard(10L, request);

		assertThat(response.title()).isEqualTo("新タイトル");
		assertThat(response.description()).isEqualTo("新説明");
		assertThat(response.priority()).isEqualTo("high");
		assertThat(response.dueDate()).isEqualTo(LocalDate.of(2026, 2, 1));
		assertThat(response.displayOrder()).isEqualTo(0);
	}

	@Test
	void 別カラムへ移動した場合は移動先の末尾に再配置される() {
		BoardColumn newColumn = new BoardColumn();
		setId(newColumn, 2L);

		CardUpdateRequest request = new CardUpdateRequest(2L, "新タイトル", "新説明", "high", null);
		when(cardRepository.findById(10L)).thenReturn(Optional.of(card));
		when(boardColumnRepository.findById(2L)).thenReturn(Optional.of(newColumn));
		when(cardRepository.findFirstByColumnIdOrderByDisplayOrderDesc(2L))
				.thenReturn(Optional.of(existingCardWithOrder(3)));
		when(cardRepository.save(any(Card.class))).thenAnswer(invocation -> invocation.getArgument(0));

		var response = cardService.updateCard(10L, request);

		assertThat(response.columnId()).isEqualTo(2L);
		assertThat(response.displayOrder()).isEqualTo(4);
	}

	@Test
	void 存在しないカードIDを指定すると更新で404が返る() {
		CardUpdateRequest request = new CardUpdateRequest(1L, "新タイトル", null, "high", null);
		when(cardRepository.findById(999L)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> cardService.updateCard(999L, request))
				.isInstanceOf(ResponseStatusException.class)
				.hasMessageContaining("Card not found");
	}

	@Test
	void 存在しない移動先カラムを指定すると更新で404が返る() {
		CardUpdateRequest request = new CardUpdateRequest(2L, "新タイトル", null, "high", null);
		when(cardRepository.findById(10L)).thenReturn(Optional.of(card));
		when(boardColumnRepository.findById(2L)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> cardService.updateCard(10L, request))
				.isInstanceOf(ResponseStatusException.class)
				.hasMessageContaining("Column not found");

		verify(cardRepository, org.mockito.Mockito.never()).save(any());
	}

	@Test
	void カラム先頭に移動できる() {
		CardPositionUpdateRequest request = new CardPositionUpdateRequest(1L, null);
		when(cardRepository.findById(12L)).thenReturn(Optional.of(cardC));
		when(boardColumnRepository.findById(1L)).thenReturn(Optional.of(column));
		when(cardRepository.findAllByColumnIdOrderByDisplayOrderAsc(1L))
				.thenReturn(List.of(cardA, cardB, cardC));
		when(cardRepository.saveAll(anyList())).thenAnswer(invocation -> invocation.getArgument(0));

		cardService.updateCardPosition(12L, request);

		assertThat(cardC.getDisplayOrder()).isEqualTo(0);
		assertThat(cardA.getDisplayOrder()).isEqualTo(1);
		assertThat(cardB.getDisplayOrder()).isEqualTo(2);
	}

	@Test
	void 指定したカードの直後に移動できる() {
		CardPositionUpdateRequest request = new CardPositionUpdateRequest(1L, 10L);
		when(cardRepository.findById(12L)).thenReturn(Optional.of(cardC));
		when(boardColumnRepository.findById(1L)).thenReturn(Optional.of(column));
		when(cardRepository.findAllByColumnIdOrderByDisplayOrderAsc(1L))
				.thenReturn(List.of(cardA, cardB, cardC));
		when(cardRepository.saveAll(anyList())).thenAnswer(invocation -> invocation.getArgument(0));

		cardService.updateCardPosition(12L, request);

		assertThat(cardA.getDisplayOrder()).isEqualTo(0);
		assertThat(cardC.getDisplayOrder()).isEqualTo(1);
		assertThat(cardB.getDisplayOrder()).isEqualTo(2);
	}

	@Test
	void 別カラムへ位置指定で移動すると移動先のカラムに割り当てられる() {
		BoardColumn otherColumn = new BoardColumn();
		setId(otherColumn, 2L);
		Card otherCard = newCard(20L, otherColumn, 0);

		CardPositionUpdateRequest request = new CardPositionUpdateRequest(2L, 20L);
		when(cardRepository.findById(10L)).thenReturn(Optional.of(cardA));
		when(boardColumnRepository.findById(2L)).thenReturn(Optional.of(otherColumn));
		when(cardRepository.findAllByColumnIdOrderByDisplayOrderAsc(2L))
				.thenReturn(List.of(otherCard));
		when(cardRepository.saveAll(anyList())).thenAnswer(invocation -> invocation.getArgument(0));

		var response = cardService.updateCardPosition(10L, request);

		assertThat(response.columnId()).isEqualTo(2L);
		assertThat(otherCard.getDisplayOrder()).isEqualTo(0);
		assertThat(cardA.getDisplayOrder()).isEqualTo(1);
	}

	@Test
	void 存在しないカードIDを指定すると位置更新で404が返る() {
		CardPositionUpdateRequest request = new CardPositionUpdateRequest(1L, null);
		when(cardRepository.findById(999L)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> cardService.updateCardPosition(999L, request))
				.isInstanceOf(ResponseStatusException.class)
				.hasMessageContaining("Card not found");
	}

	@Test
	void 存在しない移動先カラムを指定すると位置更新で404が返る() {
		CardPositionUpdateRequest request = new CardPositionUpdateRequest(999L, null);
		when(cardRepository.findById(10L)).thenReturn(Optional.of(cardA));
		when(boardColumnRepository.findById(999L)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> cardService.updateCardPosition(10L, request))
				.isInstanceOf(ResponseStatusException.class)
				.hasMessageContaining("Column not found");
	}

	@Test
	void 存在しないafterCardIdを指定すると404が返る() {
		CardPositionUpdateRequest request = new CardPositionUpdateRequest(1L, 999L);
		when(cardRepository.findById(10L)).thenReturn(Optional.of(cardA));
		when(boardColumnRepository.findById(1L)).thenReturn(Optional.of(column));
		when(cardRepository.findAllByColumnIdOrderByDisplayOrderAsc(1L))
				.thenReturn(List.of(cardA, cardB, cardC));

		assertThatThrownBy(() -> cardService.updateCardPosition(10L, request))
				.isInstanceOf(ResponseStatusException.class)
				.hasMessageContaining("Card not found");
	}

	private Card existingCardWithOrder(int order) {
		Card other = new Card();
		other.setDisplayOrder(order);
		return other;
	}

	private Card newCard(Long id, BoardColumn column, int displayOrder) {
		Card c = new Card();
		setId(c, id);
		c.setColumn(column);
		c.setDisplayOrder(displayOrder);
		return c;
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
