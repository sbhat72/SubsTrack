package com.substrack.service;

import com.substrack.dto.ForecastEntry;
import com.substrack.dto.ForecastResponse;
import com.substrack.model.BillingCycle;
import com.substrack.model.Subscription;
import com.substrack.model.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ForecastServiceTest {

    @Mock private SubscriptionService subscriptionService;
    @InjectMocks private ForecastService forecastService;

    private User user;

    @BeforeEach
    void setUp() {
        user = User.builder()
                .id(1L).email("u@example.com").passwordHash("x").fullName("U").build();
    }

    @Test
    void monthlySubscription_appearsInAllTwelveMonths() {
        Subscription sub = Subscription.builder()
                .id(1L).name("Netflix")
                .amount(new BigDecimal("10.00"))
                .billingCycle(BillingCycle.MONTHLY)
                .nextBillingDate(YearMonth.now().atDay(1))
                .build();
        when(subscriptionService.getActiveSubscriptionEntities(user)).thenReturn(List.of(sub));

        ForecastResponse response = forecastService.buildForecast(user);

        assertThat(response.getEntries()).hasSize(12);
        assertThat(response.getEntries()).allSatisfy(e ->
                assertThat(e.getSubscriptions()).hasSize(1));
        assertThat(response.getTotalTwelveMonths()).isEqualByComparingTo("120.00");
    }

    @Test
    void yearlySubscription_appearsInOneMonthOnly() {
        Subscription sub = Subscription.builder()
                .id(2L).name("iCloud")
                .amount(new BigDecimal("99.00"))
                .billingCycle(BillingCycle.YEARLY)
                .nextBillingDate(YearMonth.now().atDay(1))
                .build();
        when(subscriptionService.getActiveSubscriptionEntities(user)).thenReturn(List.of(sub));

        ForecastResponse response = forecastService.buildForecast(user);

        long monthsWithBilling = response.getEntries().stream()
                .filter(e -> !e.getSubscriptions().isEmpty())
                .count();
        assertThat(monthsWithBilling).isEqualTo(1);
        assertThat(response.getTotalTwelveMonths()).isEqualByComparingTo("99.00");
    }

    @Test
    void weeklySubscription_countedCorrectlyAcrossMonths() {
        LocalDate startDate = YearMonth.now().atDay(1);
        Subscription sub = Subscription.builder()
                .id(3L).name("Gym")
                .amount(new BigDecimal("5.00"))
                .billingCycle(BillingCycle.WEEKLY)
                .nextBillingDate(startDate)
                .build();
        when(subscriptionService.getActiveSubscriptionEntities(user)).thenReturn(List.of(sub));

        LocalDate windowEnd = YearMonth.now().plusMonths(11).atEndOfMonth();
        int expectedCount = 0;
        LocalDate d = startDate;
        while (!d.isAfter(windowEnd)) {
            expectedCount++;
            d = d.plusWeeks(1);
        }

        ForecastResponse response = forecastService.buildForecast(user);

        int actualCount = response.getEntries().stream()
                .mapToInt(e -> e.getSubscriptions().size())
                .sum();
        assertThat(actualCount).isEqualTo(expectedCount);
        assertThat(response.getTotalTwelveMonths())
                .isEqualByComparingTo(new BigDecimal("5.00").multiply(BigDecimal.valueOf(expectedCount)));
    }

    @Test
    void totalTwelveMonths_isSumOfAllEntries() {
        Subscription sub1 = Subscription.builder()
                .id(1L).name("Netflix")
                .amount(new BigDecimal("15.99"))
                .billingCycle(BillingCycle.MONTHLY)
                .nextBillingDate(YearMonth.now().atDay(1))
                .build();
        Subscription sub2 = Subscription.builder()
                .id(2L).name("Spotify")
                .amount(new BigDecimal("9.99"))
                .billingCycle(BillingCycle.MONTHLY)
                .nextBillingDate(YearMonth.now().atDay(1))
                .build();
        when(subscriptionService.getActiveSubscriptionEntities(user)).thenReturn(List.of(sub1, sub2));

        ForecastResponse response = forecastService.buildForecast(user);

        BigDecimal sumFromEntries = response.getEntries().stream()
                .map(ForecastEntry::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        assertThat(response.getTotalTwelveMonths()).isEqualByComparingTo(sumFromEntries);
    }

    @Test
    void emptySubscriptions_returnsZeroForecast() {
        when(subscriptionService.getActiveSubscriptionEntities(user)).thenReturn(List.of());

        ForecastResponse response = forecastService.buildForecast(user);

        assertThat(response.getTotalTwelveMonths()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(response.getAverageMonthly()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(response.getEntries()).hasSize(12);
        assertThat(response.getEntries()).allSatisfy(e ->
                assertThat(e.getSubscriptions()).isEmpty());
    }
}
