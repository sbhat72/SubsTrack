package com.substrack.dto;

import com.substrack.model.BillingCycle;
import com.substrack.model.Subscription;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
public class SubscriptionResponse {

    private Long id;
    private Long userId;
    private String name;
    private String description;
    private BigDecimal amount;
    private String currency;
    private BillingCycle billingCycle;
    private LocalDate nextBillingDate;
    private LocalDate cancellationDate;
    private Boolean isActive;
    private String category;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static SubscriptionResponse from(Subscription s) {
        return SubscriptionResponse.builder()
                .id(s.getId())
                .userId(s.getUser().getId())
                .name(s.getName())
                .description(s.getDescription())
                .amount(s.getAmount())
                .currency(s.getCurrency())
                .billingCycle(s.getBillingCycle())
                .nextBillingDate(s.getNextBillingDate())
                .cancellationDate(s.getCancellationDate())
                .isActive(s.getIsActive())
                .category(s.getCategory())
                .createdAt(s.getCreatedAt())
                .updatedAt(s.getUpdatedAt())
                .build();
    }
}
