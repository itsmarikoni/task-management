package com.example.taskmanagement.repository;

import static org.assertj.core.api.Assertions.assertThat;

import com.example.taskmanagement.entity.BoardColumn;
import com.example.taskmanagement.entity.Card;
import java.time.LocalDate;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

@DataJpaTest
@ActiveProfiles("test")
class CardRepositoryTest {

	@Autowired
	private CardRepository cardRepository;

	@Autowired
	private BoardColumnRepository boardColumnRepository;

	private BoardColumn column;

	@BeforeEach
	void setUp() {
		column = new BoardColumn();
		column.setName("未着手");
		column.setDisplayOrder(0);
		column = boardColumnRepository.save(column);
	}

	@Test
	void カラム内のカードを表示順に取得できる() {
		saveCard(column, "カードB", 1);
		saveCard(column, "カードA", 0);

		var cards = cardRepository.findAllByColumnIdOrderByDisplayOrderAsc(column.getId());

		assertThat(cards).extracting(Card::getTitle).containsExactly("カードA", "カードB");
	}

	@Test
	void カラム内の最後尾のカードを取得できる() {
		saveCard(column, "カードA", 0);
		saveCard(column, "カードB", 1);

		Optional<Card> last = cardRepository.findFirstByColumnIdOrderByDisplayOrderDesc(column.getId());

		assertThat(last).isPresent();
		assertThat(last.get().getTitle()).isEqualTo("カードB");
	}

	@Test
	void カードが存在しないカラムでは空リストが返る() {
		var cards = cardRepository.findAllByColumnIdOrderByDisplayOrderAsc(column.getId());

		assertThat(cards).isEmpty();
	}

	private Card saveCard(BoardColumn column, String title, int displayOrder) {
		Card card = new Card();
		card.setColumn(column);
		card.setTitle(title);
		card.setDescription("説明");
		card.setPriority("中");
		card.setDueDate(LocalDate.of(2026, 1, 1));
		card.setDisplayOrder(displayOrder);
		return cardRepository.save(card);
	}

}
