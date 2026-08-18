package com.example.taskmanagement.repository;

import com.example.taskmanagement.entity.BoardColumn;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BoardColumnRepository extends JpaRepository<BoardColumn, Long> {

	List<BoardColumn> findAllByOrderByDisplayOrderAsc();

}
