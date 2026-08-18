package com.example.taskmanagement.repository;

import com.example.taskmanagement.entity.Card;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CardRepository extends JpaRepository<Card, Long> {

	List<Card> findAllByColumnIdOrderByDisplayOrderAsc(Long columnId);

}
