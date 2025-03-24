import { useState, useEffect, useCallback } from 'react';
import React from 'react';
import { FaCalendarAlt, FaClock, FaGamepad, FaBell, FaExternalLinkAlt, FaTwitch } from 'react-icons/fa';
import { getChannelSchedule } from '../../services/twitch/twitch-api';
import { TwitchScheduleSegment } from '../../services/twitch/twitch-types';
import { trackClick } from '../utils/analytics';

// Constants
const CHANNEL_NAME = 'akanedothis';
const BROADCASTER_ID = '400615151'; // Updated to the correct Twitch ID
const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes
const DAYS_OF_WEEK = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const DEFAULT_SCHEDULE = [
  { day: 'Lundi', time: '20h00 - 23h00', title: 'Folie Speedrun', color: 'blue' },
  { day: 'Mercredi', time: '20h00 - 23h00', title: 'Programmation Créative', color: 'pink' },
  { day: 'Vendredi', time: '20h00 - 00h00', title: 'Soirée Gaming Communautaire', color: 'purple' }
];

export default function Schedule() {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  const [schedule, setSchedule] = useState<TwitchScheduleSegment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nextStream, setNextStream] = useState<Date | null>(null);

  // Format date to locale time string
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  // Format date range for display
  const formatTimeRange = (start: Date, end: Date): string => {
    return `${formatTime(start)} - ${formatTime(end)}`;
  };

  // Get day of week in French
  const getDayOfWeek = (date: Date): string => {
    return DAYS_OF_WEEK[date.getDay()];
  };

  // Fetch Twitch schedule data
  const fetchScheduleData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch schedule using Twitch API
      const scheduleData = await getChannelSchedule(BROADCASTER_ID);

      if (scheduleData && scheduleData.data && scheduleData.data.segments) {
        // Filter for upcoming segments (next 7 days)
        const now = new Date();
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 6);

        const upcomingSegments = scheduleData.data.segments.filter(segment => {
          const segmentStart = new Date(segment.start_time);
          return segmentStart >= now && segmentStart <= nextWeek;
        });

        // Sort by start time
        upcomingSegments.sort((a, b) =>
          new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
        );

        setSchedule(upcomingSegments);

        // Set next stream for countdown
        if (upcomingSegments.length > 0) {
          setNextStream(new Date(upcomingSegments[0].start_time));
        } else {
          // Fallback to default next Monday at 8PM
          setNextStream(getDefaultNextStreamDate());
        }
      } else {
        // Fallback to default schedule if no data
        setNextStream(getDefaultNextStreamDate());
      }
    } catch (err) {
      console.error('Error fetching Twitch schedule:', err);
      setError('Could not load schedule data');

      // Fallback to default next stream date
      setNextStream(getDefaultNextStreamDate());
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get default next stream date (next Monday at 8PM)
  const getDefaultNextStreamDate = (): Date => {
    const now = new Date();
    const nextStream = new Date();

    // Set to next Monday
    nextStream.setDate(now.getDate() + ((1 + 7 - now.getDay()) % 7));
    // Set to 8PM
    nextStream.setHours(20, 0, 0, 0);

    // If it's already past this Monday 8PM, go to next Monday
    if (now > nextStream) {
      nextStream.setDate(nextStream.getDate() + 7);
    }

    return nextStream;
  };

  // Calculate time left until next stream
  const calculateTimeLeft = useCallback(() => {
    if (!nextStream) return;

    const difference = nextStream.getTime() - new Date().getTime();

    if (difference > 0) {
      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60)
      });
    } else {
      // If countdown reached zero, refresh schedule data
      fetchScheduleData();
    }
  }, [nextStream, fetchScheduleData]);

  // Initialize data and start timer
  useEffect(() => {
    fetchScheduleData();

    // Set up refresh interval for schedule data
    const dataRefreshInterval = setInterval(() => {
      fetchScheduleData();
    }, REFRESH_INTERVAL);

    return () => clearInterval(dataRefreshInterval);
  }, [fetchScheduleData]);

  // Update countdown timer
  useEffect(() => {
    if (!nextStream) return;

    // Initial calculation
    calculateTimeLeft();

    // Update every second
    const timer = setInterval(calculateTimeLeft, 1000);

    // Cleanup
    return () => clearInterval(timer);
  }, [nextStream, calculateTimeLeft]);

  // Handle calendar reminder
  const handleAddToCalendar = (event: TwitchScheduleSegment) => {
    const start = new Date(event.start_time);
    const end = new Date(event.end_time);

    // Create Google Calendar URL
    const title = encodeURIComponent(`Twitch Stream: ${event.title}`);
    const details = encodeURIComponent(`${event.broadcaster_name} will be streaming on Twitch.\n\nhttps://twitch.tv/${CHANNEL_NAME}`);
    const dates = `${start.toISOString().replace(/-|:|\.\d+/g, '')}`
               + `/${end.toISOString().replace(/-|:|\.\d+/g, '')}`;

    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&dates=${dates}`;

    // Track event
    trackClick('schedule', 'add-calendar', event.title);

    // Open calendar URL
    window.open(googleCalendarUrl, '_blank');
  };

  // Open Twitch channel
  const openTwitchChannel = () => {
    trackClick('schedule', 'open-twitch');
    window.open(`https://twitch.tv/${CHANNEL_NAME}`, '_blank');
  };

  // Determine card color based on day or title (for visual variety)
  const getCardColor = (segment: TwitchScheduleSegment): string => {
    const startDate = new Date(segment.start_time);
    const day = startDate.getDay();

    // Check for keywords in title for color theming
    const title = segment.title.toLowerCase();
    if (title.includes('speedrun')) return 'blue';
    if (title.includes('code') || title.includes('programme') || title.includes('dev')) return 'pink';
    if (title.includes('communautaire') || title.includes('gaming')) return 'purple';

    // Fallback to day-based coloring for visual variety
    return ['blue', 'pink', 'purple', 'lime'][day % 4];
  };

  // Create schedule cards from segments or fallback to default
  const createScheduleCards = () => {
    if (schedule.length > 0) {
      return schedule.map((segment, index) => {
        const startDate = new Date(segment.start_time);
        const endDate = new Date(segment.end_time);
        const color = getCardColor(segment);
  
        return (
          <div className="card-3d-container" key={segment.id || index}>
            <div className={`neo-card neo-card-${color} card-3d p-6 flex flex-col h-full`}>
              <div className="flex justify-between items-start mb-3">
                <h3 className={`neon-text ${color === 'blue' ? 'cyan' : color} text-xl font-cyber flex items-center`}>
                  <FaCalendarAlt className="mr-2" />
                  {getDayOfWeek(startDate)}
                </h3>
                <span className="text-sm bg-black/30 px-2 py-1 rounded font-body flex items-center">
                  <FaClock className="mr-1" /> {formatTimeRange(startDate, endDate)}
                </span>
              </div>
  
              <h4 className="text-lg font-semibold mb-2">{segment.title}</h4>
  
              {segment.category && (
                <p className="text-sm mb-4 flex items-center text-gray-300">
                  <FaGamepad className="mr-1" /> {segment.category.name}
                </p>
              )}
  
              <div className="mt-auto pt-4 flex justify-center">
                <button
                  onClick={() => handleAddToCalendar(segment)}
                  className={`text-sm px-3 py-1 flex items-center justify-center border-2 border-${color === 'blue' ? 'electric-blue' :
                    color === 'pink' ? 'neon-pink' :
                    color === 'purple' ? 'bright-purple' : 'vivid-lime'}
                    hover:bg-${color === 'blue' ? 'electric-blue' :
                    color === 'pink' ? 'neon-pink' :
                    color === 'purple' ? 'bright-purple' : 'vivid-lime'}/20 transition`}
                >
                  <FaBell className="mr-1" /> Rappel
                </button>
              </div>
            </div>
          </div>
        );
      });
    } else {
      // Fallback to default schedule
      return DEFAULT_SCHEDULE.map((item, index) => (
        <div className="card-3d-container" key={index}>
          <div className={`neo-card neo-card-${item.color} card-3d p-6 flex flex-col items-center text-center`}>
            <h3 className={`neon-text ${item.color === 'blue' ? 'cyan' : item.color} text-xl mb-2 font-cyber`}>{item.day}</h3>
            <p className="text-lg font-body">{item.time}</p>
            <p className="mt-2 font-body">{item.title}</p>
          </div>
        </div>
      ));
    }
  };
  

  return (
    <section id="schedule" className="py-20 bg-black/70">
      <div className="container mx-auto px-4">
        <h2 className="neon-text lime text-center text-4xl mb-6 font-cyber">Programme des Streams</h2>

        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-vivid-lime"></div>
            <span className="ml-2">Chargement du programme...</span>
          </div>
        ) : (
          <>
            {/* Countdown to next stream */}
            <div className="card-3d-container max-w-2xl mx-auto">
              <div className="neo-card neo-card-lime card-3d p-8">
                <div className="flex flex-col md:flex-row justify-between items-center">
                  <div className="mb-4 md:mb-0 md:mr-6 text-center md:text-left">
                    <h3 className="neon-text lime text-2xl mb-2 font-cyber">Prochain Stream</h3>
                    {nextStream && (
                      <div>
                        <p className="text-xl font-body mb-1">
                          {getDayOfWeek(nextStream)} {nextStream.toLocaleDateString('fr-FR')}
                        </p>
                        <p className="text-lg font-body text-electric-blue">
                          {formatTime(nextStream)}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="w-full md:w-auto">
                    <h4 className="text-center text-vivid-lime mb-2 font-cyber">Compte à Rebours</h4>
                    <div className="grid grid-cols-4 gap-2 md:gap-4">
                      <div className="p-2 bg-black/30 rounded text-center">
                        <div className="text-3xl font-bold neon-text cyan">{timeLeft.days}</div>
                        <div className="text-xs uppercase font-body">Jours</div>
                      </div>
                      <div className="p-2 bg-black/30 rounded text-center">
                        <div className="text-3xl font-bold neon-text pink">{timeLeft.hours}</div>
                        <div className="text-xs uppercase font-body">Heures</div>
                      </div>
                      <div className="p-2 bg-black/30 rounded text-center">
                        <div className="text-3xl font-bold neon-text lime">{timeLeft.minutes}</div>
                        <div className="text-xs uppercase font-body">Minutes</div>
                      </div>
                      <div className="p-2 bg-black/30 rounded text-center">
                        <div className="text-3xl font-bold neon-text purple">{timeLeft.seconds}</div>
                        <div className="text-xs uppercase font-body">Secondes</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-center mt-6">
                  <p className="font-body">Rejoignez-moi pour le prochain stream et faites partie de l'expérience !</p>
                  <div className="mt-4 flex justify-center gap-4">
                    <a
                      href={`https://twitch.tv/${CHANNEL_NAME}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block px-6 py-2 border-2 border-vivid-lime text-white bg-vivid-lime/20 hover:bg-vivid-lime/40 transition duration-300 font-cyber"
                      onClick={() => trackClick('schedule', 'watch-twitch')}
                    >
                      <FaTwitch className="inline-block mr-2" />
                      Regarder sur Twitch
                    </a>
                    {nextStream && (
                      <button
                        onClick={() => handleAddToCalendar({
                          id: 'next-stream',
                          start_time: nextStream.toISOString(),
                          end_time: new Date(nextStream.getTime() + 3 * 60 * 60 * 1000).toISOString(),
                          title: 'Prochain Stream AkaneDoThis',
                          broadcaster_id: BROADCASTER_ID,
                          broadcaster_name: CHANNEL_NAME
                        })}
                        className="inline-block px-6 py-2 border-2 border-electric-blue text-white hover:bg-electric-blue/20 transition duration-300 font-cyber"
                      >
                        <FaBell className="inline-block mr-2" />
                        Définir un Rappel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <br />
            {/* Twitch Status Badge */}
        <div className="flex justify-center mb-8">
          <button
            onClick={openTwitchChannel}
            className="flex items-center px-4 py-2 bg-bright-purple/20 border border-bright-purple rounded-full text-white hover:bg-bright-purple/40 transition"
          >
            <FaTwitch className="mr-2" />
            <span>Suivez sur Twitch pour notifications</span>
            <FaExternalLinkAlt className="ml-2" size={12} />
          </button>
        </div>
            <hr />
            <br/>
            <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-6 mb-12">
              {createScheduleCards()}
            </div>
          </>

          
        )}

        {error && (
          <div className="mt-4 p-2 bg-red-900/30 border border-red-500 text-red-200 rounded text-center text-sm">
            {error}
          </div>
        )}
      </div>
    </section>
  );
}
