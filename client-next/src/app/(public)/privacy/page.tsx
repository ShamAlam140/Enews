export default function Privacy() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
        <div className="w-20 h-1 bg-red-600 mx-auto"></div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-8">
        <div className="prose prose-lg max-w-none">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Commitment to Privacy</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              At SusaNews, we take your privacy seriously. This policy outlines how we collect, 
              use, and protect your personal information when you use our news platform.
            </p>
          </div>

          <div className="space-y-8">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Information We Collect</h3>
              <ul className="space-y-2 text-gray-700">
                <li>• Basic analytics data to improve user experience</li>
                <li>• Newsletter subscription information (if opted in)</li>
                <li>• Comments and interactions on news articles</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">How We Use Information</h3>
              <ul className="space-y-2 text-gray-700">
                <li>• To deliver personalized news content</li>
                <li>• To improve our services and user experience</li>
                <li>• To communicate important updates</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Data Protection</h3>
              <p className="text-gray-700 leading-relaxed">
                We implement industry-standard security measures to protect your data from 
                unauthorized access, alteration, or destruction. Your trust is our top priority.
              </p>
            </div>

            <div className="bg-blue-50 p-6 rounded-lg text-blue-900">
              <h3 className="text-lg font-semibold mb-2">Contact Us</h3>
              <p className="text-blue-800">
                If you have any questions about our privacy practices, please contact us at:
                <br />
                <strong>privacy@SusaNews.com</strong>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
