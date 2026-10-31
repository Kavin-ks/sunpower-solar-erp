package com.sunpower.repository;

import com.sunpower.entity.Expense;
import com.sunpower.entity.enums.Enums.ExpenseCategory;
import com.sunpower.entity.enums.Enums.ExpenseStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface ExpenseRepository extends JpaRepository<Expense, Long> {
    List<Expense> findBySalesOrderId(Long salesOrderId);
    List<Expense> findByCategory(ExpenseCategory category);
    List<Expense> findByStatus(ExpenseStatus status);
    List<Expense> findAllByOrderByExpenseDateDesc();

    boolean existsByTitleAndAmountAndExpenseDate(String title, BigDecimal amount, LocalDate expenseDate);

    @Query("SELECT SUM(e.amount) FROM Expense e WHERE e.salesOrder.id = :orderId AND e.status != 'REJECTED'")
    BigDecimal sumExpensesByOrderId(Long orderId);

    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM Expense e WHERE e.status != 'REJECTED'")
    BigDecimal sumTotalExpenses();
}
