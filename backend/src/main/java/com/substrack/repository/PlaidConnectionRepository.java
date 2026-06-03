package com.substrack.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.substrack.model.PlaidConnection;

@Repository
public interface PlaidConnectionRepository extends JpaRepository<PlaidConnection, Long> {
        List<PlaidConnection> findByUser_Id(Long userId);
    
}
