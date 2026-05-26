package com.substrack.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
public class ForecastEntry {
    private String month;
    private int monthNumber;
    private int year;
    private BigDecimal totalAmount;
    private List<ForecastLineItem> subscriptions;
}
