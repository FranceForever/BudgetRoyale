import React, { useState, useEffect, useRef } from 'react';
import { db, auth } from '../firebase';
import { doc, getDoc, setDoc, collection, query, onSnapshot, addDoc, updateDoc, Timestamp } from 'firebase/firestore';
import '../App.css'; // Ensure this path is correct based on your file structure
import Chart from 'chart.js/auto';
import categorizeExpense from '../pages/api/categorizeExpense';

const Dashboard = () => {
  const [expenses, setExpenses] = useState([]);
  const [income, setIncome] = useState([]);
  const [recurring, setRecurring] = useState([]);
  const [expenseName, setExpenseName] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('');
  const [incomeName, setIncomeName] = useState('');
  const [incomeAmount, setIncomeAmount] = useState('');
  const [recurringName, setRecurringName] = useState('');
  const [recurringAmount, setRecurringAmount] = useState('');
  const [recurringType, setRecurringType] = useState('');
  const [recurringFrequency, setRecurringFrequency] = useState('');
  const [budget, setBudget] = useState({ daily: 0, weekly: 0, monthly: 0, annual: 0 });
  const [points, setPoints] = useState(0);
  const [totalSpent, setTotalSpent] = useState({ daily: 0, weekly: 0, monthly: 0, annual: 0 });
  const [totalIncome, setTotalIncome] = useState(0);
  const [newBudget, setNewBudget] = useState('');
  const [itemBudgetIncrease, setItemBudgetIncrease] = useState('');
  const [unlockedFeatures, setUnlockedFeatures] = useState({});
  const [errorMessage, setErrorMessage] = useState('');
  const [theme, setTheme] = useState('light-mode');

  const [budgetPeriod, setBudgetPeriod] = useState('monthly'); // Add this line to define the budgetPeriod state and its setter function

  const rewardTiers = {
    premiumCategories: 100,
    budgetAnalysis: 200,
    personalizedAdvice: 300,
    goalTracking: 400,
    themesSkins: 150,
    profileCustomization: 250,
    customNotifications: 350,
  };

  const expenseDistributionChartRef = useRef(null);
  const expenseTrendsChartRef = useRef(null);
  const incomeTrendsChartRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setBudget(userData.budget || { daily: 0, weekly: 0, monthly: 0, annual: 0 });
          setPoints(userData.points || 0);
          setTotalSpent(userData.totalSpent || { daily: 0, weekly: 0, monthly: 0, annual: 0 });
          setTotalIncome(userData.totalIncome || 0);
          setUnlockedFeatures(userData.unlockedFeatures || {});
        }

        // Set up real-time listener for expenses
        const expensesQuery = query(collection(db, 'users', user.uid, 'expenses'));
        const unsubscribeExpenses = onSnapshot(expensesQuery, (querySnapshot) => {
          const expensesArray = [];
          querySnapshot.forEach((doc) => {
            expensesArray.push({ id: doc.id, ...doc.data() });
          });
          setExpenses(expensesArray);

          const totalSpent = { daily: 0, weekly: 0, monthly: 0, annual: 0 };
          expensesArray.forEach((expense) => {
            const timestamp = expense.timestamp;
            if (timestamp) {
              const date = new Date(timestamp.seconds * 1000);
              totalSpent.daily += expense.amount; // Modify this logic to match your requirements
              totalSpent.weekly += expense.amount; // Modify this logic to match your requirements
              totalSpent.monthly += expense.amount; // Modify this logic to match your requirements
              totalSpent.annual += expense.amount; // Modify this logic to match your requirements
            }
          });
          setTotalSpent(totalSpent);
        });

        // Set up real-time listener for income
        const incomeQuery = query(collection(db, 'users', user.uid, 'income'));
        const unsubscribeIncome = onSnapshot(incomeQuery, (querySnapshot) => {
          const incomeArray = [];
          querySnapshot.forEach((doc) => {
            incomeArray.push({ id: doc.id, ...doc.data() });
          });
          setIncome(incomeArray);
        });

        // Set up real-time listener for recurring transactions
        const recurringQuery = query(collection(db, 'users', user.uid, 'recurring'));
        const unsubscribeRecurring = onSnapshot(recurringQuery, (querySnapshot) => {
          const recurringArray = [];
          querySnapshot.forEach((doc) => {
            recurringArray.push({ id: doc.id, ...doc.data() });
          });
          setRecurring(recurringArray);
        });

        // Cleanup subscription on unmount
        return () => {
          unsubscribeExpenses();
          unsubscribeIncome();
          unsubscribeRecurring();
        };
      }
    };
    fetchData();
  }, []);

  const handleAddExpense = async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (user) {
      let category = expenseCategory;
      
      // if (!category) {
      //   category = await categorizeExpense(expenseName); // Use the imported function
      // }
      
      const newExpense = { 
        name: expenseName, 
        amount: parseFloat(expenseAmount), 
        category, 
        timestamp: Timestamp.now() 
      };

      if (totalSpent[budgetPeriod] + newExpense.amount > budget[budgetPeriod]) {
        setErrorMessage('Adding this expense will exceed your budget.');
        return;
      }

      await addDoc(collection(db, 'users', user.uid, 'expenses'), newExpense);

      const newTotalSpent = { ...totalSpent, [budgetPeriod]: totalSpent[budgetPeriod] + parseFloat(expenseAmount) };

      // Calculate points
      let newPoints = points + 500; // Base points for adding an expense
      if (category) {
        newPoints += 5; // Bonus points for categorizing the expense
      }
      if (newTotalSpent[budgetPeriod] <= budget[budgetPeriod]) {
        newPoints += 15; // Bonus points for staying within budget
      }

      const updatedUnlockedFeatures = { ...unlockedFeatures };
      if (newPoints >= rewardTiers.premiumCategories) updatedUnlockedFeatures.premiumCategories = true;
      if (newPoints >= rewardTiers.budgetAnalysis) updatedUnlockedFeatures.budgetAnalysis = true;
      if (newPoints >= rewardTiers.personalizedAdvice) updatedUnlockedFeatures.personalizedAdvice = true;
      if (newPoints >= rewardTiers.goalTracking) updatedUnlockedFeatures.goalTracking = true;
      if (newPoints >= rewardTiers.themesSkins) updatedUnlockedFeatures.themesSkins = true;
      if (newPoints >= rewardTiers.profileCustomization) updatedUnlockedFeatures.profileCustomization = true;
      if (newPoints >= rewardTiers.customNotifications) updatedUnlockedFeatures.customNotifications = true;

      await setDoc(doc(db, 'users', user.uid), {
        budget,
        points: newPoints,
        totalSpent: newTotalSpent,
        unlockedFeatures: updatedUnlockedFeatures
      }, { merge: true });

      setExpenseName('');
      setExpenseAmount('');
      setExpenseCategory('');
      setPoints(newPoints);
      setTotalSpent(newTotalSpent);
      setUnlockedFeatures(updatedUnlockedFeatures);
      setErrorMessage(''); // Clear error message
    }
  };
  const handleAddIncome = async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (user) {
      const newIncome = { name: incomeName, amount: parseFloat(incomeAmount), timestamp: Timestamp.now() };
      await addDoc(collection(db, 'users', user.uid, 'income'), newIncome);

      const newTotalIncome = totalIncome + parseFloat(incomeAmount);

      await updateDoc(doc(db, 'users', user.uid), {
        totalIncome: newTotalIncome
      });

      setIncomeName('');
      setIncomeAmount('');
      setTotalIncome(newTotalIncome);
    }
  };

  const handleAddRecurring = async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (user) {
      const newRecurring = {
        name: recurringName,
        amount: parseFloat(recurringAmount),
        type: recurringType,
        frequency: recurringFrequency,
        lastAdded: Timestamp.now()
      };
      await addDoc(collection(db, 'users', user.uid, 'recurring'), newRecurring);

      setRecurringName('');
      setRecurringAmount('');
      setRecurringType('');
      setRecurringFrequency('');
    }
  };

  const handleSetBudget = async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (user && newBudget !== '') {
      let updatedBudget = { ...budget, [budgetPeriod]: parseFloat(newBudget) };
      let updatedPoints = points;
      if (budget[budgetPeriod] > 0 && newBudget > budget[budgetPeriod]) {
        if (points < 50) {
          setErrorMessage('You need at least 50 points to increase the budget.');
          return;
        }
        updatedPoints -= 50;
      }

      await setDoc(doc(db, 'users', user.uid), {
        budget: updatedBudget,
        points: updatedPoints
      }, { merge: true });

      setBudget(updatedBudget);
      setPoints(updatedPoints);
      setNewBudget('');
      setErrorMessage(''); // Clear error message
    }
  };

  const handleIncreaseItemBudget = async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (user && itemBudgetIncrease !== '') {
      if (points < 20) {
        setErrorMessage('You need at least 20 points to increase the item budget.');
        return;
      }

      const updatedPoints = points - 20;
      const updatedBudget = { ...budget, [budgetPeriod]: budget[budgetPeriod] + parseFloat(itemBudgetIncrease) };

      await setDoc(doc(db, 'users', user.uid), {
        budget: updatedBudget,
        points: updatedPoints
      }, { merge: true });

      setBudget(updatedBudget);
      setPoints(updatedPoints);
      setItemBudgetIncrease('');
      setErrorMessage(''); // Clear error message
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      // Redirect to login
    } catch (error) {
      console.error('Error logging out: ', error);
    }
  };

  const handleToggleTheme = async () => {
    const user = auth.currentUser;
    if (user) {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (!userData.unlockedDarkMode && theme === 'light-mode') {
          if (userData.points < 1000) {
            setErrorMessage('You need at least 1000 points to unlock dark mode.');
            return;
          }
          await updateDoc(doc(db, 'users', user.uid), {
            points: userData.points - 1000,
            unlockedDarkMode: true
          });
          setPoints(userData.points - 1000);
        }
        const newTheme = theme === 'light-mode' ? 'dark-mode' : 'light-mode';
        await updateDoc(doc(db, 'users', user.uid), {
          theme: newTheme
        });
        setTheme(newTheme);
        setErrorMessage(''); // Clear error message
      }
    }
  };

  useEffect(() => {
    const generateCharts = () => {
      if (expenseDistributionChartRef.current) {
        expenseDistributionChartRef.current.destroy();
      }
      if (expenseTrendsChartRef.current) {
        expenseTrendsChartRef.current.destroy();
      }
      if (incomeTrendsChartRef.current) {
        incomeTrendsChartRef.current.destroy();
      }

      const categorizedExpenses = expenses.reduce((acc, expense) => {
        const category = expense.category || 'Uncategorized';
        if (!acc[category]) {
          acc[category] = 0;
        }
        acc[category] += expense.amount;
        return acc;
      }, {});

      // Generate Expense Distribution Pie Chart
      const ctx1 = document.getElementById('expenseDistributionChart').getContext('2d');
      expenseDistributionChartRef.current = new Chart(ctx1, {
        type: 'pie',
        data: {
          labels: Object.keys(categorizedExpenses),
          datasets: [{
            label: 'Expense Distribution',
            data: Object.values(categorizedExpenses),
            backgroundColor: [
              '#FF6384',
              '#36A2EB',
              '#FFCE56',
              '#FF9F40',
              '#FFCD56',
              '#4BC0C0'
            ]
          }]
        },
        options: {
          plugins: {
            tooltip: {
              callbacks: {
                label: function (tooltipItem) {
                  return `${tooltipItem.label}: $${tooltipItem.raw}`;
                }
              }
            }
          }
        }
      });

      // Generate Expense Trends Line Chart
      const expenseTimestamps = expenses.map(expense => expense.timestamp ? new Date(expense.timestamp.seconds * 1000).toLocaleDateString() : 'Unknown');
      const expenseAmounts = expenses.map(expense => expense.amount);

      const ctx2 = document.getElementById('expenseTrendsChart').getContext('2d');
      expenseTrendsChartRef.current = new Chart(ctx2, {
        type: 'line',
        data: {
          labels: expenseTimestamps,
          datasets: [{
            label: 'Expense Trends',
            data: expenseAmounts,
            borderColor: '#FF6384',
            backgroundColor: '#FF6384',
            fill: false
          }]
        },
        options: {
          plugins: {
            tooltip: {
              callbacks: {
                label: function (tooltipItem) {
                  return `${tooltipItem.label}: $${tooltipItem.raw}`;
                }
              }
            }
          }
        }
      });

      // Generate Income Trends Line Chart
      const incomeTimestamps = income.map(incomeItem => incomeItem.timestamp ? new Date(incomeItem.timestamp.seconds * 1000).toLocaleDateString() : 'Unknown');
      const incomeAmounts = income.map(incomeItem => incomeItem.amount);

      const ctx3 = document.getElementById('incomeTrendsChart').getContext('2d');
      incomeTrendsChartRef.current = new Chart(ctx3, {
        type: 'line',
        data: {
          labels: incomeTimestamps,
          datasets: [{
            label: 'Income Trends',
            data: incomeAmounts,
            borderColor: '#36A2EB',
            backgroundColor: '#36A2EB',
            fill: false
          }]
        },
        options: {
          plugins: {
            tooltip: {
              callbacks: {
                label: function (tooltipItem) {
                  return `${tooltipItem.label}: $${tooltipItem.raw}`;
                }
              }
            }
          }
        }
      });
    };

    if (expenses.length > 0 || income.length > 0) {
      generateCharts();
    }
  }, [expenses, income]);

  return (
    <div className={`app ${theme}`}>
      {/* Section: Page title, logout button, dark mode toggle */}
      <header className="dashboard-header">
        <h2>Dashboard</h2>
        <button className="logout-button" onClick={handleLogout}>Logout</button>
        <button className="toggle-theme-button" onClick={handleToggleTheme}>
          {theme === 'light-mode' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
        </button>
      </header>
      {errorMessage && <p className="error-message">{errorMessage}</p>}

      {/* Section: Account summary */}
      <div className="cards-container">
        <div className="card">
          <p>Points</p>
          <h3>{points}</h3>
        </div>
        <div className="card">
          <p>Daily Budget</p>
          <h3>${budget.daily}</h3>
        </div>
        <div className="card">
          <p>Weekly Budget</p>
          <h3>${budget.weekly}</h3>
        </div>
        <div className="card">
          <p>Monthly Budget</p>
          <h3>${budget.monthly}</h3>
        </div>
        <div className="card">
          <p>Annual Budget</p>
          <h3>${budget.annual}</h3>
        </div>
        <div className="card">
          <p>Total Spent (Daily)</p>
          <h3>${totalSpent.daily}</h3>
        </div>
        <div className="card">
          <p>Total Spent (Weekly)</p>
          <h3>${totalSpent.weekly}</h3>
        </div>
        <div className="card">
          <p>Total Spent (Monthly)</p>
          <h3>${totalSpent.monthly}</h3>
        </div>
        <div className="card">
          <p>Total Spent (Annual)</p>
          <h3>${totalSpent.annual}</h3>
        </div>
        <div className="card">
          <p>Total Income</p>
          <h3>${totalIncome}</h3>
        </div>
      </div>

      {/* Section: Enter transactions, set budget, progress bars */}
      <section className="transaction-section">
        <form onSubmit={handleAddExpense}>
          <input
            type="text"
            value={expenseName}
            onChange={(e) => setExpenseName(e.target.value)}
            placeholder="Expense Name"
          />
          <input
            type="number"
            value={expenseAmount}
            onChange={(e) => setExpenseAmount(e.target.value)}
            placeholder="Expense Amount"
          />
          {unlockedFeatures.premiumCategories && (
            <input
              type="text"
              value={expenseCategory}
              onChange={(e) => setExpenseCategory(e.target.value)}
              placeholder="Category (optional)"
            />
          )}
          <button type="submit">Add Expense</button>
        </form>
        <form onSubmit={handleAddIncome}>
          <input
            type="text"
            value={incomeName}
            onChange={(e) => setIncomeName(e.target.value)}
            placeholder="Income Name"
          />
          <input
            type="number"
            value={incomeAmount}
            onChange={(e) => setIncomeAmount(e.target.value)}
            placeholder="Income Amount"
          />
          <button type="submit">Add Income</button>
        </form>
        <form onSubmit={handleAddRecurring}>
          <input
            type="text"
            value={recurringName}
            onChange={(e) => setRecurringName(e.target.value)}
            placeholder="Recurring Transaction Name"
          />
          <input
            type="number"
            value={recurringAmount}
            onChange={(e) => setRecurringAmount(e.target.value)}
            placeholder="Amount"
          />
          <select value={recurringType} onChange={(e) => setRecurringType(e.target.value)}>
            <option value="">Select Type</option>
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
          <select value={recurringFrequency} onChange={(e) => setRecurringFrequency(e.target.value)}>
            <option value="">Select Frequency</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
          <button type="submit">Add Recurring Transaction</button>
        </form>
        <form onSubmit={handleSetBudget}>
          <input
            type="number"
            value={newBudget}
            onChange={(e) => setNewBudget(e.target.value)}
            placeholder="Set New Budget"
          />
          <select value={budgetPeriod} onChange={(e) => setBudgetPeriod(e.target.value)}>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="annual">Annual</option>
          </select>
          <button type="submit">Set Budget</button>
        </form>
        <form onSubmit={handleIncreaseItemBudget}>
          <input
            type="number"
            value={itemBudgetIncrease}
            onChange={(e) => setItemBudgetIncrease(e.target.value)}
            placeholder="Increase Budget By"
          />
          <button type="submit">Increase Budget</button>
        </form>
        <BudgetUsage budget={budget} totalSpent={totalSpent} theme={theme} />
      </section>

      {/* Section: Lists of expenses and incomes */}
      <section className="list-section">
        <h3>Expenses</h3>
        <ul>
          {expenses.map((expense) => (
            <li key={expense.id} className={`expense-item ${theme}`}>{expense.name}: ${expense.amount} - {expense.category}</li>
          ))}
        </ul>
        <h3>Income</h3>
        <ul>
          {income.map((incomeItem) => (
            <li key={incomeItem.id} className={`income-item ${theme}`}>{incomeItem.name}: ${incomeItem.amount}</li>
          ))}
        </ul>
        <h3>Recurring Transactions</h3>
        <ul>
          {recurring.map((recurringItem) => (
            <li key={recurringItem.id} className={`recurring-item ${recurringItem.type} ${theme}`}>{recurringItem.name}: ${recurringItem.amount} - {recurringItem.type} - {recurringItem.frequency}</li>
          ))}
        </ul>
      </section>

      {/* Section: Graphs */}
      <section className="chart-section">
        <div className="chart-container">
          <canvas id="expenseDistributionChart"></canvas>
        </div>
        <div className="chart-container">
          <canvas id="expenseTrendsChart"></canvas>
        </div>
        <div className="chart-container">
          <canvas id="incomeTrendsChart"></canvas>
        </div>
      </section>

      {/* Section: Other potential future features */}
      <section className="feature-section">
        {unlockedFeatures.personalizedAdvice && <PersonalizedAdvice />}
        {unlockedFeatures.goalTracking && <GoalTracking />}
        {unlockedFeatures.themesSkins && <ThemesSkins />}
        {unlockedFeatures.profileCustomization && <ProfileCustomization />}
        {unlockedFeatures.customNotifications && <CustomNotifications />}
      </section>
    </div>
  );
};

// Components for the unlocked features
const PersonalizedAdvice = () => (
  <div className="feature">
    <h3>Personalized Financial Advice</h3>
    {/* Add your personalized financial advice implementation here */}
  </div>
);

const GoalTracking = () => (
  <div className="feature">
    <h3>Goal Setting and Tracking</h3>
    {/* Add your goal setting and tracking implementation here */}
  </div>
);

const ThemesSkins = () => (
  <div className="feature">
    <h3>Themes and Skins</h3>
    {/* Add your themes and skins implementation here */}
  </div>
);

const ProfileCustomization = () => (
  <div className="feature">
    <h3>Profile Customization</h3>
    {/* Add your profile customization implementation here */}
  </div>
);

const CustomNotifications = () => (
  <div className="feature">
    <h3>Custom Notifications</h3>
    {/* Add your custom notifications implementation here */}
  </div>
);

const BudgetUsage = ({ budget, totalSpent, theme }) => {
  const periods = ['daily', 'weekly', 'monthly', 'annual'];

  return (
    <div className={`budget-usage ${theme}`}>
      {periods.map((period) => {
        const remainingBudget = budget[period] - (totalSpent[period] || 0);
        const percentageSpent = ((totalSpent[period] || 0) / budget[period]) * 100;
        const budgetExceeded = remainingBudget < 0;

        return (
          <div key={period}>
            <h4>{`${period.charAt(0).toUpperCase() + period.slice(1)} Budget`}</h4>
            <div className="budget-bar">
              <div
                className="spent-bar"
                style={{
                  width: `${Math.min(percentageSpent, 100)}%`,
                  backgroundColor: budgetExceeded ? 'red' : 'green',
                }}
              ></div>
            </div>
            <p>{budgetExceeded ? `Budget exceeded by $${Math.abs(remainingBudget).toFixed(2)}` : `Remaining Budget: $${remainingBudget.toFixed(2)}`}</p>
            <p>{`Spent: $${(totalSpent[period] || 0).toFixed(2)}`}</p>
          </div>
        );
      })}
    </div>
  );
};

export default Dashboard;