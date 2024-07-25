// const openai = require('../openaiConfig');

// const categorizeExpense = async (expenseName) => {
//   const prompt = `Categorize this item into one of the following 10 categories: Groceries, Utilities, Rent, Transportation, Entertainment, Dining, Health, Education, Personal Care, Miscellaneous.\n\nItem: ${expenseName}`;
//   try {
//     const response = await openai.createCompletion({
//       model: "text-davinci-003",
//       prompt: prompt,
//       max_tokens: 10,
//     });
//     return response.data.choices[0].text.trim();
//   } catch (error) {
//     console.error("Error categorizing expense:", error);
//     return "Miscellaneous";
//   }
// };

// module.exports = categorizeExpense;