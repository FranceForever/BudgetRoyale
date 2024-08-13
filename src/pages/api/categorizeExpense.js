// import openai from '../../utils/openaiConfig';

// export default async function handler(req, res) {
//   if (!res) {
//     console.error('Response object (res) is undefined');
//     return;
//   }

//   if (req.method === 'POST') {
//     const { expenseName } = req.body;

//     if (!expenseName) {
//       return res.status(400).json({ error: 'Expense name is required' });
//     }

//     try {
//       const prompt = `Categorize this item into one of the following 10 categories: Groceries, Utilities, Rent, Transportation, Entertainment, Dining, Health, Education, Personal Care, Miscellaneous.\n\nItem: ${expenseName}`;

//       const response = await openai.completions.create({
//         model: "gpt-4o-mini",
//         prompt: prompt,
//         max_tokens: 10,
//       });

//       if (response && response.choices && response.choices.length > 0) {
//         const category = response.choices[0].text.trim();
//         if (!category) {
//           // If the category is somehow empty or undefined, handle it here
//           return res.status(500).json({ error: 'Failed to categorize the expense' });
//         }
//         return res.status(200).json({ category });
//       } else {
//         console.error('Unexpected response structure:', response);
//         return res.status(500).json({ error: 'Unexpected response structure from OpenAI API' });
//       }
//     } catch (error) {
//       console.error('Error while communicating with OpenAI API:', error);

//       if (res && res.status) {
//         return res.status(500).json({
//           error: error.message || 'An error occurred while categorizing the expense',
//         });
//       } else {
//         console.error('Response object is missing or undefined');
//         return;
//       }
//     }
//   } else {
//     if (res && res.status) {
//       return res.status(405).json({ error: 'Method not allowed' });
//     } else {
//       console.error('Response object is missing or undefined');
//       return;
//     }
//   }
// }