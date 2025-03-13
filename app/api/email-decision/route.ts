// pages/api/send-decision-email.js
import { createClient } from '@supabase/supabase-js';
import Mailjet from 'node-mailjet';
import type { NextApiRequest, NextApiResponse } from 'next'

type ResponseData = {
    message: string
}
// Initialize Mailjet client
const mailjet = Mailjet.apiConnect(
  process.env.MAILJET_API_KEY as string,
  process.env.MAILJET_SECRET_KEY as string
);


export async function POST(request: Request) {
  const { email, name, status, notes } = await request.json()
  
  if (!email || !status) {
    return Response.json({ message: 'Missing required fields' },{status:400})
  }
  
  try {
    // Choose template ID based on status
    const templateId = status === 'approved' 
      ? parseInt(process.env.MAILJET_APPROVED_TEMPLATE_ID as string) 
      : parseInt(process.env.MAILJET_REJECTED_TEMPLATE_ID as string);
    
    // Prepare template variables
    const variables = {
      developer_name: name,
      evaluator_notes: notes || 'No additional notes provided.',
      submission_date: new Date().toLocaleDateString(),
      status: status.charAt(0).toUpperCase() + status.slice(1)
    };
    
    // Send email using Mailjet
    const request = mailjet
      .post('send', { version: 'v3.1' })
      .request({
        Messages: [
          {
            From: {
              Email: process.env.EMAIL_FROM,
              Name: 'Developer Evaluation Team'
            },
            To: [
              {
                Email: email,
                Name: name
              }
            ],
            TemplateID: templateId,
            TemplateLanguage: true,
            Variables: variables
          }
        ]
      });
    
    const result = await request;
    
    if (result.body.Messages[0].Status !== 'success') {
      throw new Error('Failed to send email via Mailjet');
    }
    

    return Response.json({ success: true })
  } catch (error:any) {
    console.error('Error sending email:', error);
    return Response.json({ message: 'Failed to send email', error: error.message },{status:500})
  }
}

