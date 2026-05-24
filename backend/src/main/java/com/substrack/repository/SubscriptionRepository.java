package com.substrack.repository;

import com.substrack.model.Subscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SubscriptionRepository extends JpaRepository<Subscription, Long> {
    List<Subscription> findByUserId(Long userId);
    List<Subscription> findByUserIdAndIsActiveTrue(Long userId);
    boolean existsByUserIdAndName(Long userId, String name);
}
