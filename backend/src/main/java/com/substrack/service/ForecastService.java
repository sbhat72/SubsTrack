package com.substrack.service;

import com.substrack.dto.ForecastEntry;
import com.substrack.dto.ForecastLineItem;
import com.substrack.dto.ForecastResponse;
import com.substrack.model.BillingCycle;
import com.substrack.model.Subscription;
import com.substrack.model.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ForecastService {

    private final SubscriptionService subscriptionService;

    public ForecastResponse buildForecast(User user) {
        List<Subscription> subscriptions = subscriptionService.getActiveSubscriptionEntities(user);

        YearMonth startMonth = YearMonth.now();
        LocalDate windowEnd = startMonth.plusMonths(11).atEndOfMonth();

        Map<YearMonth, List<ForecastLineItem>> buckets = new LinkedHashMap<>();
        for (int i = 0; i < 12; i++) {
            buckets.put(startMonth.plusMonths(i), new ArrayList<>());
        }

        for (Subscription sub : subscriptions) {
            LocalDate billingDate = sub.getNextBillingDate();
            while (!billingDate.isAfter(windowEnd)) {
                YearMonth ym = YearMonth.from(billingDate);
                if (buckets.containsKey(ym)) {
                    buckets.get(ym).add(ForecastLineItem.builder()
                            .subscriptionId(sub.getId())
                            .subscriptionName(sub.getName())
                            .amount(sub.getAmount())
                            .billingCycle(sub.getBillingCycle())
                            .billingDate(billingDate)
                            .build());
                }
                billingDate = advance(billingDate, sub.getBillingCycle());
            }
        }

        List<ForecastEntry> entries = new ArrayList<>();
        BigDecimal total = BigDecimal.ZERO;

        for (Map.Entry<YearMonth, List<ForecastLineItem>> e : buckets.entrySet()) {
            YearMonth ym = e.getKey();
            List<ForecastLineItem> items = e.getValue();
            BigDecimal monthTotal = items.stream()
                    .map(ForecastLineItem::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            total = total.add(monthTotal);
            entries.add(ForecastEntry.builder()
                    .month(ym.getMonth().getDisplayName(TextStyle.FULL, Locale.ENGLISH) + " " + ym.getYear())
                    .monthNumber(ym.getMonthValue())
                    .year(ym.getYear())
                    .totalAmount(monthTotal)
                    .subscriptions(items)
                    .build());
        }

        BigDecimal average = total.divide(BigDecimal.valueOf(12), 2, RoundingMode.HALF_UP);

        return ForecastResponse.builder()
                .generatedAt(LocalDateTime.now())
                .totalTwelveMonths(total)
                .averageMonthly(average)
                .entries(entries)
                .build();
    }

    private LocalDate advance(LocalDate date, BillingCycle cycle) {
        return switch (cycle) {
            case MONTHLY -> date.plusMonths(1);
            case YEARLY -> date.plusYears(1);
            case WEEKLY -> date.plusWeeks(1);
            case BIWEEKLY -> date.plusWeeks(2);
        };
    }
}
