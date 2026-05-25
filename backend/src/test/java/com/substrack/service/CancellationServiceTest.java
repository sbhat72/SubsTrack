package com.substrack.service;

import com.substrack.dto.CancellationResponse;
import com.substrack.model.BillingCycle;
import com.substrack.model.Subscription;
import com.substrack.model.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

class CancellationServiceTest {

    private CancellationService cancellationService;
    private User owner;

    @BeforeEach
    void setUp() {
        cancellationService = new CancellationService();
        owner = User.builder().id(1L).email("u@example.com").passwordHash("x").fullName("U").build();
    }

    // ── getNextCycleDate ──────────────────────────────────────────────────────

    @Test
    void getNextCycleDate_monthly_addsOneMonth() {
        LocalDate date = LocalDate.of(2026, 1, 15);
        assertThat(cancellationService.getNextCycleDate(date, BillingCycle.MONTHLY))
                .isEqualTo(LocalDate.of(2026, 2, 15));
    }

    @Test
    void getNextCycleDate_yearly_addsOneYear() {
        LocalDate date = LocalDate.of(2026, 6, 1);
        assertThat(cancellationService.getNextCycleDate(date, BillingCycle.YEARLY))
                .isEqualTo(LocalDate.of(2027, 6, 1));
    }

    @Test
    void getNextCycleDate_weekly_addsOneWeek() {
        LocalDate date = LocalDate.of(2026, 1, 5);
        assertThat(cancellationService.getNextCycleDate(date, BillingCycle.WEEKLY))
                .isEqualTo(LocalDate.of(2026, 1, 12));
    }

    // ── getCancellationDeadline — happy paths ─────────────────────────────────

    @Test
    void getCancellationDeadline_monthly_isOneDayBeforeBilling() {
        LocalDate billing = LocalDate.now().plusMonths(1);
        Subscription sub = buildSub(billing, BillingCycle.MONTHLY);

        assertThat(cancellationService.getCancellationDeadline(sub))
                .isEqualTo(billing.minusDays(1));
    }

    @Test
    void getCancellationDeadline_yearly_isThreeDaysBeforeBilling() {
        LocalDate billing = LocalDate.now().plusYears(1);
        Subscription sub = buildSub(billing, BillingCycle.YEARLY);

        assertThat(cancellationService.getCancellationDeadline(sub))
                .isEqualTo(billing.minusDays(3));
    }

    @Test
    void getCancellationDeadline_weekly_isOneDayBeforeBilling() {
        LocalDate billing = LocalDate.now().plusWeeks(2);
        Subscription sub = buildSub(billing, BillingCycle.WEEKLY);

        assertThat(cancellationService.getCancellationDeadline(sub))
                .isEqualTo(billing.minusDays(1));
    }

    // ── getCancellationDeadline — expired deadline rolls to next cycle ────────

    @Test
    void getCancellationDeadline_expiredMonthly_rollsToNextCycle() {
        // nextBillingDate is 2 months ago → natural deadline (minusDays(1)) is in the past
        LocalDate pastBilling = LocalDate.now().minusMonths(2);
        Subscription sub = buildSub(pastBilling, BillingCycle.MONTHLY);

        LocalDate expected = pastBilling.plusMonths(1).minusDays(1);
        assertThat(cancellationService.getCancellationDeadline(sub)).isEqualTo(expected);
    }

    @Test
    void getCancellationDeadline_expiredYearly_rollsToNextCycle() {
        LocalDate pastBilling = LocalDate.now().minusYears(1).minusDays(10);
        Subscription sub = buildSub(pastBilling, BillingCycle.YEARLY);

        LocalDate expected = pastBilling.plusYears(1).minusDays(3);
        assertThat(cancellationService.getCancellationDeadline(sub)).isEqualTo(expected);
    }

    // ── daysUntilDeadline ─────────────────────────────────────────────────────

    @Test
    void buildResponse_daysUntilDeadline_isCorrect() {
        LocalDate billing = LocalDate.now().plusDays(10); // deadline = now + 9
        Subscription sub = buildSub(billing, BillingCycle.MONTHLY);

        CancellationResponse response = cancellationService.buildResponse(sub);

        assertThat(response.getDaysUntilDeadline()).isEqualTo(9L);
        assertThat(response.getIsDeadlinePassed()).isFalse();
    }

    @Test
    void buildResponse_expiredDeadline_flaggedAndRolledForward() {
        LocalDate pastBilling = LocalDate.now().minusMonths(2);
        Subscription sub = buildSub(pastBilling, BillingCycle.MONTHLY);

        CancellationResponse response = cancellationService.buildResponse(sub);

        assertThat(response.getIsDeadlinePassed()).isTrue();
        assertThat(response.getCancellationDeadline()).isAfterOrEqualTo(LocalDate.now());
        assertThat(response.getDaysUntilDeadline()).isGreaterThanOrEqualTo(0L);
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private Subscription buildSub(LocalDate nextBillingDate, BillingCycle cycle) {
        return Subscription.builder()
                .id(1L)
                .user(owner)
                .name("Test Sub")
                .amount(new BigDecimal("9.99"))
                .currency("CAD")
                .billingCycle(cycle)
                .nextBillingDate(nextBillingDate)
                .isActive(true)
                .build();
    }
}
