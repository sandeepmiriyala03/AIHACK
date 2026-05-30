// ============================================================
// RupantarCode — Business Scenarios
// AksharaTantra · Yuktishaalaa AI Lab
// ============================================================

import type { Scenario, SupportedLang } from '@/types/rupantar.types';

export const SCENARIOS: Record<SupportedLang, Scenario[]> = {
  java: [
    {
      name: 'REST Controller',
      code: `// Spring Boot REST Controller
@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService userService;

    @GetMapping
    public List<User> getAllUsers() {
        return userService.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable Long id) {
        User user = userService.findById(id);
        if (user == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(user);
    }

    @PostMapping
    public User createUser(@RequestBody User user) {
        return userService.save(user);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userService.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}`,
    },
    {
      name: 'ArrayList & HashMap',
      code: `// Java Collections
import java.util.*;

public class InventoryManager {

    public static void main(String[] args) {
        List<String> products = new ArrayList<>();
        products.add("Laptop");
        products.add("Mouse");
        products.add("Keyboard");

        Map<String, Double> prices = new HashMap<>();
        prices.put("Laptop", 999.99);
        prices.put("Mouse", 29.99);
        prices.put("Keyboard", 79.99);

        double total = 0;
        for (String product : products) {
            double price = prices.getOrDefault(product, 0.0);
            System.out.println(product + ": $" + price);
            total += price;
        }
        System.out.println("Total: $" + total);
    }
}`,
    },
    {
      name: 'Exception Handling',
      code: `// Java Exception Handling
public class BankAccount {
    private double balance;
    private String accountId;

    public BankAccount(String accountId, double initialBalance) {
        this.accountId = accountId;
        this.balance = initialBalance;
    }

    public void withdraw(double amount) throws IllegalArgumentException {
        if (amount <= 0) {
            throw new IllegalArgumentException("Amount must be positive");
        }
        if (amount > balance) {
            throw new IllegalArgumentException("Insufficient funds");
        }
        balance -= amount;
        System.out.println("Withdrawn: " + amount);
    }

    public double getBalance() {
        return balance;
    }
}`,
    },
    {
      name: 'Java Streams',
      code: `// Java 8 Streams
import java.util.*;
import java.util.stream.*;

public class SalesAnalyzer {

    public static void main(String[] args) {
        List<Integer> sales = Arrays.asList(120, 340, 89, 456, 230, 78, 560);

        List<Integer> highSales = sales.stream()
            .filter(s -> s > 200)
            .sorted()
            .collect(Collectors.toList());

        int total = sales.stream().mapToInt(Integer::intValue).sum();
        OptionalDouble avg = sales.stream().mapToInt(Integer::intValue).average();

        System.out.println("High sales: " + highSales);
        System.out.println("Total: " + total);
        System.out.println("Average: " + avg.orElse(0));
    }
}`,
    },
  ],

  csharp: [
    {
      name: 'LINQ Query',
      code: `// C# LINQ Operations
using System;
using System.Collections.Generic;
using System.Linq;

public class EmployeeAnalyzer {

    public static void Main(string[] args) {
        var employees = new List<Employee> {
            new Employee { Name = "Alice", Department = "IT", Salary = 75000 },
            new Employee { Name = "Bob",   Department = "HR", Salary = 55000 },
            new Employee { Name = "Carol", Department = "IT", Salary = 82000 },
            new Employee { Name = "Dave",  Department = "HR", Salary = 61000 }
        };

        var itTeam = employees
            .Where(e => e.Department == "IT")
            .OrderByDescending(e => e.Salary)
            .Select(e => new { e.Name, e.Salary });

        var avgByDept = employees
            .GroupBy(e => e.Department)
            .Select(g => new { Dept = g.Key, Avg = g.Average(e => e.Salary) });

        foreach (var emp in itTeam)
            Console.WriteLine($"{emp.Name}: {emp.Salary}");
    }
}`,
    },
    {
      name: 'Async/Await',
      code: `// C# Async/Await HTTP
using System;
using System.Net.Http;
using System.Threading.Tasks;

public class ApiService {

    private readonly HttpClient _client = new HttpClient();

    public async Task<string> FetchUserAsync(int userId) {
        try {
            string url = $"https://api.example.com/users/{userId}";
            HttpResponseMessage response = await _client.GetAsync(url);
            response.EnsureSuccessStatusCode();
            string content = await response.Content.ReadAsStringAsync();
            return content;
        } catch (HttpRequestException ex) {
            Console.WriteLine($"Request failed: {ex.Message}");
            return null;
        }
    }

    public async Task ProcessUsersAsync(int[] userIds) {
        var tasks = userIds.Select(id => FetchUserAsync(id));
        var results = await Task.WhenAll(tasks);
        foreach (var result in results)
            Console.WriteLine(result);
    }
}`,
    },
    {
      name: 'Entity Framework',
      code: `// C# Entity Framework Core
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;

public class Product {
    public int Id { get; set; }
    public string Name { get; set; }
    public decimal Price { get; set; }
    public int CategoryId { get; set; }
    public Category Category { get; set; }
}

public class ShopContext : DbContext {
    public DbSet<Product> Products { get; set; }

    public async Task<List<Product>> GetProductsByCategoryAsync(int categoryId) {
        return await Products
            .Where(p => p.CategoryId == categoryId && p.Price < 500)
            .Include(p => p.Category)
            .OrderBy(p => p.Price)
            .ToListAsync();
    }
}`,
    },
  ],

  js: [
    {
      name: 'Express API',
      code: `// Express.js REST API
const express = require('express');
const app = express();
app.use(express.json());

const users = [];

app.get('/users', (req, res) => {
    res.json(users);
});

app.get('/users/:id', (req, res) => {
    const user = users.find(u => u.id === parseInt(req.params.id));
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
});

app.post('/users', (req, res) => {
    const { name, email } = req.body;
    if (!name || !email) {
        return res.status(400).json({ error: 'Name and email required' });
    }
    const user = { id: users.length + 1, name, email };
    users.push(user);
    res.status(201).json(user);
});

app.listen(3000, () => console.log('Server running on port 3000'));`,
    },
    {
      name: 'Promises & Async',
      code: `// JavaScript Async/Await + Fetch
async function fetchUserData(userId) {
    try {
        const response = await fetch(\`https://api.example.com/users/\${userId}\`);
        if (!response.ok) throw new Error(\`HTTP error: \${response.status}\`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Failed to fetch user:', error.message);
        return null;
    }
}

async function processMultipleUsers(userIds) {
    const promises = userIds.map(id => fetchUserData(id));
    const results = await Promise.all(promises);
    return results.filter(Boolean);
}

const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const evenSquares = numbers.filter(n => n % 2 === 0).map(n => n * n);
console.log('Even squares:', evenSquares);`,
    },
    {
      name: 'Class & OOP',
      code: `// JavaScript Class
class ShoppingCart {
    constructor(customerId) {
        this.customerId = customerId;
        this.items = [];
        this.discount = 0;
    }

    addItem(name, price, qty = 1) {
        const existing = this.items.find(i => i.name === name);
        if (existing) { existing.qty += qty; }
        else { this.items.push({ name, price, qty }); }
    }

    removeItem(name) {
        this.items = this.items.filter(i => i.name !== name);
    }

    applyDiscount(percent) {
        this.discount = percent / 100;
    }

    getTotal() {
        const subtotal = this.items.reduce((sum, i) => sum + i.price * i.qty, 0);
        return subtotal * (1 - this.discount);
    }
}`,
    },
  ],

  ts: [
    {
      name: 'Interface & Types',
      code: `// TypeScript Interfaces
interface User {
    id: number;
    name: string;
    email: string;
    role: 'admin' | 'user' | 'guest';
    createdAt: Date;
}

interface ApiResponse<T> {
    data: T;
    status: number;
    message: string;
    success: boolean;
}

type UserList = User[];

function filterByRole(users: UserList, role: User['role']): UserList {
    return users.filter(u => u.role === role);
}

function createUser(name: string, email: string, role: User['role'] = 'user'): User {
    return {
        id: Math.floor(Math.random() * 10000),
        name,
        email,
        role,
        createdAt: new Date()
    };
}`,
    },
    {
      name: 'Generics',
      code: `// TypeScript Generics
class Repository<T extends { id: number }> {
    private items: T[] = [];

    add(item: T): void {
        this.items.push(item);
    }

    findById(id: number): T | undefined {
        return this.items.find(i => i.id === id);
    }

    getAll(): T[] {
        return [...this.items];
    }

    remove(id: number): boolean {
        const index = this.items.findIndex(i => i.id === id);
        if (index === -1) return false;
        this.items.splice(index, 1);
        return true;
    }

    count(): number {
        return this.items.length;
    }
}`,
    },
  ],

  sql: [
    {
      name: 'SELECT & JOINs',
      code: `-- SQL Server: Customer Orders Report
SELECT
    c.CustomerID,
    c.CustomerName,
    c.Email,
    COUNT(o.OrderID)  AS TotalOrders,
    SUM(o.Amount)     AS TotalSpent,
    MAX(o.OrderDate)  AS LastOrderDate
FROM Customers c
LEFT JOIN Orders o ON c.CustomerID = o.CustomerID
WHERE c.IsActive = 1
  AND o.OrderDate >= DATEADD(MONTH, -12, GETDATE())
GROUP BY c.CustomerID, c.CustomerName, c.Email
HAVING COUNT(o.OrderID) > 0
ORDER BY TotalSpent DESC;`,
    },
    {
      name: 'Stored Procedure',
      code: `-- SQL Server Stored Procedure
CREATE PROCEDURE GetEmployeeReport
    @DepartmentId INT = NULL,
    @MinSalary    DECIMAL(10,2) = 0,
    @StartDate    DATE = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        e.EmployeeId,
        e.FirstName + ' ' + e.LastName AS FullName,
        d.DepartmentName,
        e.Salary,
        e.HireDate,
        DATEDIFF(YEAR, e.HireDate, GETDATE()) AS YearsOfService
    FROM Employees e
    INNER JOIN Departments d ON e.DepartmentId = d.DepartmentId
    WHERE (@DepartmentId IS NULL OR e.DepartmentId = @DepartmentId)
      AND e.Salary >= @MinSalary
      AND (@StartDate IS NULL OR e.HireDate >= @StartDate)
    ORDER BY e.Salary DESC;
END`,
    },
    {
      name: 'T-SQL Cursor',
      code: `-- T-SQL: Inventory Reorder Logic
DECLARE @ReorderLevel INT = 50;
DECLARE @ProductId    INT;
DECLARE @CurrentStock INT;

DECLARE stock_cursor CURSOR FOR
    SELECT ProductId, StockQuantity
    FROM Products
    WHERE StockQuantity < @ReorderLevel AND IsActive = 1;

OPEN stock_cursor;
FETCH NEXT FROM stock_cursor INTO @ProductId, @CurrentStock;

WHILE @@FETCH_STATUS = 0
BEGIN
    IF @CurrentStock < 10
        PRINT 'URGENT: Product ' + CAST(@ProductId AS VARCHAR) + ' critically low';
    ELSE
        PRINT 'Reorder needed: Product ' + CAST(@ProductId AS VARCHAR);

    UPDATE Products SET ReorderFlag = 1 WHERE ProductId = @ProductId;
    FETCH NEXT FROM stock_cursor INTO @ProductId, @CurrentStock;
END

CLOSE stock_cursor;
DEALLOCATE stock_cursor;`,
    },
    {
      name: 'CTE & Window Fns',
      code: `-- SQL Server CTE + Window Functions
WITH MonthlySales AS (
    SELECT
        YEAR(OrderDate)  AS SaleYear,
        MONTH(OrderDate) AS SaleMonth,
        SUM(Amount)      AS MonthlyTotal,
        COUNT(OrderID)   AS OrderCount
    FROM Orders
    WHERE OrderDate >= '2024-01-01'
    GROUP BY YEAR(OrderDate), MONTH(OrderDate)
),
RankedSales AS (
    SELECT *,
        RANK() OVER (PARTITION BY SaleYear ORDER BY MonthlyTotal DESC) AS MonthRank,
        LAG(MonthlyTotal, 1) OVER (ORDER BY SaleYear, SaleMonth)       AS PrevMonthTotal
    FROM MonthlySales
)
SELECT * FROM RankedSales WHERE MonthRank <= 3 ORDER BY SaleYear, MonthRank;`,
    },
  ],
};
