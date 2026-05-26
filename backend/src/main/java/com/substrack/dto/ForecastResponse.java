package com.substrack.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class ForecastResponse {
    private LocalDateTime generatedAt;
    private BigDecimal totalTwelveMonths;
    private BigDecimal averageMonthly;
    private List<ForecastEntry> entries;
}
