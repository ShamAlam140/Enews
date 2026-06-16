export default function About() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">About SusaNews</h1>
        <div className="w-20 h-1 bg-red-600 mx-auto"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div>
          <img 
            src="https://images.unsplash.com/photo-1585829365295-ab7cd400c167?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80" 
            alt="Newsroom" 
            className="rounded-xl shadow-lg w-full h-auto object-cover"
          />
        </div>
        
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h2>
            <p className="text-gray-700 leading-relaxed">
              SusaNews is committed to delivering accurate, timely, and comprehensive 
              news coverage from around the globe. Our team of experienced journalists and 
              editors work around the clock to bring you the stories that matter most.
            </p>
          </div>
          
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Values</h2>
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

      <div className="mt-16 bg-gray-100 rounded-2xl p-8">
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">Our Team</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {['Editor-in-Chief', 'Senior Correspondent', 'News Director'].map((role, index) => (
            <div key={index} className="text-center">
              <div className="w-20 h-20 bg-red-600 rounded-full mx-auto mb-4 flex items-center justify-center text-white font-bold text-xl">
                {role.charAt(0)}
              </div>
              <h3 className="font-semibold text-gray-900">{role}</h3>
              <p className="text-sm text-gray-600 mt-1">Experienced professional</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
