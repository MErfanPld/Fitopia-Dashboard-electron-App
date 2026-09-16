import React from 'react';
import { Navigate } from 'react-router-dom';
/** Legacy route — module lives at pages/tickets/TicketsPage */
export const TicketsPage: React.FC = () => <Navigate to="/tickets" replace />;
