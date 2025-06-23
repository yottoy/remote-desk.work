import React, { useState } from 'react';
import { EmailCaptureForm } from '../components/email-capture/EmailCaptureForm';
import { EmailCaptureModal } from '../components/email-capture/EmailCaptureModal';

export default function TestEmailCapture() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Default Form */}
        <section className="bg-white p-8 rounded-lg shadow">
          <h2 className="text-2xl font-bold mb-6">Default Form</h2>
          <EmailCaptureForm source="test-default" />
        </section>

        {/* Inline Form */}
        <section className="bg-white p-8 rounded-lg shadow">
          <h2 className="text-2xl font-bold mb-6">Inline Form</h2>
          <EmailCaptureForm variant="inline" source="test-inline" />
        </section>

        {/* Sticky Form */}
        <section className="bg-white p-8 rounded-lg shadow">
          <h2 className="text-2xl font-bold mb-6">Sticky Form</h2>
          <EmailCaptureForm variant="sticky" source="test-sticky" />
        </section>

        {/* Modal Form */}
        <section className="bg-white p-8 rounded-lg shadow">
          <h2 className="text-2xl font-bold mb-6">Modal Form</h2>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Open Modal
          </button>
          <EmailCaptureModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            source="test-modal"
          />
        </section>
      </div>
    </div>
  );
} 