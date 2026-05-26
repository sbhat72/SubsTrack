package com.substrack.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "subscription_price_history")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PriceHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subscription_id", nullable = false)
    private Subscription subscription;

    @Column(name = "old_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal oldAmount;

    @Column(name = "new_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal newAmount;

    @Column(name = "detected_at", updatable = false)
    private LocalDateTime detectedAt;

    @PrePersist
    protected void onCreate() {
        detectedAt = LocalDateTime.now();
    }
}
