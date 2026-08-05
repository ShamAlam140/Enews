export default function About() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">About Khabre Aaj Tak</h1>
        <div className="w-20 h-1 bg-red-600 mx-auto"></div>
      </div>

      <div className="max-w-2xl mx-auto space-y-8 bg-white rounded-2xl shadow-sm p-8">
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 border-b pb-2">Our Mission</h2>
            <p className="text-gray-700 leading-relaxed">
              Khabre Aaj Tak is committed to delivering accurate, timely, and comprehensive 
              news coverage from around the globe. Our team of experienced journalists and 
              editors work around the clock to bring you the stories that matter most.
            </p>
          </div>
          
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 border-b pb-2">Our Values</h2>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-center gap-3">
                <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                <span>Truth and accuracy in reporting</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                <span>Unbiased and balanced coverage</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                <span>Commitment to journalistic integrity</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-16 bg-gray-100 rounded-2xl p-8 max-w-md mx-auto">
        <div className="text-center">
          <div className="w-24 h-24 bg-red-600 rounded-full mx-auto mb-4 flex items-center justify-center text-white font-bold text-3xl shadow-md">
            J
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Jitendra Jain</h2>
          <p className="text-red-600 font-semibold text-sm mt-1">Founder & Editor-in-Chief</p>
          <div className="w-12 h-0.5 bg-red-600 mx-auto my-3"></div>
          <p className="text-gray-600 text-sm leading-relaxed max-w-sm mx-auto">
            Leading Khabre Aaj Tak with journalistic integrity and commitment to truth.
          </p>
        </div>
      </div>
    </div>
  );
}
