package com.sunpower.repository;

import com.sunpower.entity.Expense;
import com.sunpower.entity.enums.Enums.ExpenseCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface ExpenseRepository extends JpaRepository<Expense, Long> {
    List<Expense> findBySalesOrderId(Long salesOrderId);
    List<Expense> findByCategory(ExpenseCategory category);

    @Query("SELECT SUM(e.amount) FROM Expense e WHERE e.salesOrder.id = :orderId")
    BigDecimal sumExpensesByOrderId(Long orderId);

    @Query("SELECT SUM(e.amount) FROM Expense e")
    BigDecimal sumTotalExpenses();
}
