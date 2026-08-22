package com.example.taskmanagement.repository;

import static org.assertj.core.api.Assertions.assertThat;

import com.example.taskmanagement.entity.BoardColumn;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

@DataJpaTest
@ActiveProfiles("test")
class BoardColumnRepositoryTest {

	@Autowired
	private BoardColumnRepository boardColumnRepository;

	@Test
	void カラムを表示順に取得できる() {
		saveColumn("完了", 2);
		saveColumn("未着手", 0);
		saveColumn("進行中", 1);

		var columns = boardColumnRepository.findAllByOrderByDisplayOrderAsc();

		assertThat(columns).extracting(BoardColumn::getName).containsExactly("未着手", "進行中", "完了");
	}

	@Test
	void 表示順が最後尾のカラムを取得できる() {
		saveColumn("未着手", 0);
		saveColumn("完了", 1);

		Optional<BoardColumn> last = boardColumnRepository.findFirstByOrderByDisplayOrderDesc();

		assertThat(last).isPresent();
		assertThat(last.get().getName()).isEqualTo("完了");
	}

	@Test
	void カラムが存在しない場合は最後尾取得が空になる() {
		Optional<BoardColumn> last = boardColumnRepository.findFirstByOrderByDisplayOrderDesc();

		assertThat(last).isEmpty();
	}

	private BoardColumn saveColumn(String name, int displayOrder) {
		BoardColumn column = new BoardColumn();
		column.setName(name);
		column.setDisplayOrder(displayOrder);
		return boardColumnRepository.save(column);
	}

}
