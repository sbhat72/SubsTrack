package com.substrack.dto;

import com.substrack.model.BillingCycle;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
public class CancellationResponse {
    private Long subscriptionId;
    private String subscriptionName;
    private LocalDate nextBillingDate;
    private LocalDate cancellationDeadline;
    private long daysUntilDeadline;
    private Boolean isDeadlinePassed;
    private BillingCycle billingCycle;
    private BigDecimal amount;
}
