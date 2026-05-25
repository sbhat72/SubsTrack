package com.substrack.service;

import com.substrack.dto.CancellationResponse;
import com.substrack.model.BillingCycle;
import com.substrack.model.Subscription;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

@Service
public class CancellationService {

    /**
     * Returns the last safe day to cancel before the next (or following) billing charge.
     * Rolls forward one cycle when the natural deadline has already passed.
     */
    public LocalDate getCancellationDeadline(Subscription subscription) {
        LocalDate today = LocalDate.now();
        LocalDate nextBilling = subscription.getNextBillingDate();
        BillingCycle cycle = subscription.getBillingCycle();

        LocalDate deadline = rawDeadline(nextBilling, cycle);
        if (deadline.isBefore(today)) {
            deadline = rawDeadline(getNextCycleDate(nextBilling, cycle), cycle);
        }
        return deadline;
    }

    /**
     * Returns the billing date one full cycle after the given date.
     */
    public LocalDate getNextCycleDate(LocalDate billingDate, BillingCycle cycle) {
        return switch (cycle) {
            case MONTHLY -> billingDate.plusMonths(1);
            case YEARLY  -> billingDate.plusYears(1);
            case WEEKLY  -> billingDate.plusWeeks(1);
        };
    }

    public CancellationResponse buildResponse(Subscription subscription) {
        LocalDate today = LocalDate.now();
        LocalDate nextBilling = subscription.getNextBillingDate();
        BillingCycle cycle = subscription.getBillingCycle();

        LocalDate naturalDeadline = rawDeadline(nextBilling, cycle);
        boolean deadlinePassed = naturalDeadline.isBefore(today);

        LocalDate deadline = deadlinePassed
                ? rawDeadline(getNextCycleDate(nextBilling, cycle), cycle)
                : naturalDeadline;

        LocalDate effectiveBillingDate = deadlinePassed
                ? getNextCycleDate(nextBilling, cycle)
                : nextBilling;

        return CancellationResponse.builder()
                .subscriptionId(subscription.getId())
                .subscriptionName(subscription.getName())
                .nextBillingDate(effectiveBillingDate)
                .cancellationDeadline(deadline)
                .daysUntilDeadline(ChronoUnit.DAYS.between(today, deadline))
                .isDeadlinePassed(deadlinePassed)
                .billingCycle(cycle)
                .amount(subscription.getAmount())
                .build();
    }

    // MONTHLY / WEEKLY → 1 day before billing; YEARLY → 3 days before billing
    private LocalDate rawDeadline(LocalDate billingDate, BillingCycle cycle) {
        return switch (cycle) {
            case MONTHLY, WEEKLY -> billingDate.minusDays(1);
            case YEARLY          -> billingDate.minusDays(3);
        };
    }
}
