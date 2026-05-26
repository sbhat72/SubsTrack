package com.substrack.dto;

import com.substrack.model.BillingCycle;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
public class ForecastLineItem {
    private Long subscriptionId;
    private String subscriptionName;
    private BigDecimal amount;
    private BillingCycle billingCycle;
    private LocalDate billingDate;
}
