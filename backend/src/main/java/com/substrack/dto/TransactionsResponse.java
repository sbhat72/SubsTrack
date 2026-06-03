package com.substrack.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

import com.substrack.model.BillingCycle;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class TransactionsResponse {

    @NotBlank(message = "Name is required")
    private String name;
    
    private BigDecimal amount;

    private BillingCycle billingCycle;

    private LocalDate nextbillingDate;


}
